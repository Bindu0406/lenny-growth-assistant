import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db, AsyncSessionLocal
from app.models.db_models import SessionModel, MessageModel
from app.models.schemas import ChatMessageRequest
from app.agent import LennyAgent

router = APIRouter(prefix="/api", tags=["Chat"])

@router.post("/sessions")
async def create_session(db: AsyncSession = Depends(get_db)):
    new_session = SessionModel(title="New Growth Session")
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    return {"session_id": str(new_session.id), "title": new_session.title}

@router.get("/sessions")
async def list_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SessionModel).order_by(SessionModel.updated_at.desc()))
    sessions = result.scalars().all()
    return [{"id": str(s.id), "title": s.title, "created_at": s.created_at} for s in sessions]

@router.post("/chat")
async def chat_endpoint(payload: ChatMessageRequest, db: AsyncSession = Depends(get_db)):
    session_uuid = None
    if payload.session_id:
        try:
            session_uuid = uuid.UUID(payload.session_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid session_id format")

    if not session_uuid:
        new_session = SessionModel(title=payload.message[:40] + "...")
        db.add(new_session)
        await db.commit()
        await db.refresh(new_session)
        session_uuid = new_session.id

    user_msg = MessageModel(
        session_id=session_uuid,
        role="user",
        content=payload.message
    )
    db.add(user_msg)
    await db.commit()

    hist_result = await db.execute(
        select(MessageModel)
        .where(MessageModel.session_id == session_uuid)
        .order_by(MessageModel.created_at.asc())
    )
    history_rows = hist_result.scalars().all()
    conversation_history = [
        {"role": row.role, "content": row.content}
        for row in history_rows[:-1]
    ]

    agent = LennyAgent(session=db)
    token_stream, sources = await agent.run(
        query=payload.message,
        conversation_history=conversation_history
    )

    async def sse_event_generator():
        # Emit initial metadata
        init_payload = {
            "type": "init",
            "session_id": str(session_uuid),
            "sources": sources
        }
        yield f"data: {json.dumps(init_payload)}\n\n"

        full_content = []
        async for chunk in token_stream:
            full_content.append(chunk)
            yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"

        complete_text = "".join(full_content)

        # Use an independent session to commit the completed assistant reply safely
        async with AsyncSessionLocal() as save_db:
            assistant_msg = MessageModel(
                session_id=session_uuid,
                role="assistant",
                content=complete_text,
                sources=sources
            )
            save_db.add(assistant_msg)
            await save_db.commit()

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream"
    )