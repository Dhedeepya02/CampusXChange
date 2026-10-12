"""
Flask-SocketIO event handlers for real-time chat.

Client workflow:
  1. Connect with ?token=<jwt> query param.
  2. Emit 'join_conversation'  { conversation_id } to subscribe to a room.
  3. Emit 'send_message'       { conversation_id, content } to post a message.
  4. Server persists the message and broadcasts 'new_message' to the room.
  5. Emit 'leave_conversation' { conversation_id } to unsubscribe.
"""
from typing import Optional
from flask import request, session as flask_session
from flask_socketio import emit, join_room, leave_room, disconnect


def _authenticate() -> Optional[str]:
    """Return user_id from the ?token= query param, or None if invalid/missing."""
    from auth_utils import decode_token
    token = request.args.get("token", "")
    payload = decode_token(token)
    return payload["sub"] if payload else None


def register_socket_events(socketio):
    """Register all Socket.IO event handlers onto the given SocketIO instance."""

    @socketio.on("connect")
    def on_connect():
        user_id = _authenticate()
        if not user_id:
            disconnect()
            return False  # reject the connection
        flask_session["user_id"] = user_id

    @socketio.on("join_conversation")
    def on_join(data):
        user_id = flask_session.get("user_id")
        if not user_id:
            return

        conv_id = data.get("conversation_id", "")
        if not conv_id:
            return

        from database import db, Conversation
        conv = db.session.get(Conversation, conv_id)
        if not conv:
            return
        if conv.buyer_id != user_id and conv.seller_id != user_id:
            return

        join_room(conv_id)
        emit("joined", {"conversation_id": conv_id}, to=request.sid)

    @socketio.on("leave_conversation")
    def on_leave(data):
        conv_id = data.get("conversation_id", "")
        if conv_id:
            leave_room(conv_id)

    @socketio.on("send_message")
    def on_send_message(data):
        user_id = flask_session.get("user_id")
        if not user_id:
            return

        conv_id = data.get("conversation_id", "")
        content = (data.get("content") or "").strip()

        if not conv_id or not content:
            return

        from database import db, Conversation, Message
        conv = db.session.get(Conversation, conv_id)
        if not conv:
            return
        if conv.buyer_id != user_id and conv.seller_id != user_id:
            return

        msg = Message(
            conversation_id=conv_id,
            sender_id=user_id,
            content=content,
        )
        db.session.add(msg)
        db.session.commit()

        # Broadcast to all sockets in the room
        emit("new_message", msg.to_dict(), to=conv_id)

    @socketio.on("disconnect")
    def on_disconnect():
        pass
