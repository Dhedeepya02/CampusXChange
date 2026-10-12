"""
Message REST routes.
  GET  /api/messages/conversation/<id>  – fetch history
  POST /api/messages/conversation/<id>  – send a message (REST fallback when socket offline)

Real-time delivery is handled by Socket.IO events in socket_events.py.
"""
from flask import Blueprint, request, jsonify, current_app
from database import db, Message, Conversation
from auth_utils import require_auth

messages_bp = Blueprint("messages", __name__)


@messages_bp.get("/conversation/<conv_id>")
@require_auth
def list_messages(conv_id, current_user):
    conv = db.session.get(Conversation, conv_id)
    if not conv:
        return jsonify({"error": "Conversation not found."}), 404
    if conv.buyer_id != current_user.id and conv.seller_id != current_user.id:
        return jsonify({"error": "Forbidden."}), 403

    msgs = (
        Message.query
        .filter_by(conversation_id=conv_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return jsonify([m.to_dict() for m in msgs])


@messages_bp.post("/conversation/<conv_id>")
@require_auth
def send_message(conv_id, current_user):
    """REST fallback for sending a message (used when socket is offline)."""
    conv = db.session.get(Conversation, conv_id)
    if not conv:
        return jsonify({"error": "Conversation not found."}), 404
    if conv.buyer_id != current_user.id and conv.seller_id != current_user.id:
        return jsonify({"error": "Forbidden."}), 403

    data    = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "Message content cannot be empty."}), 400

    msg = Message(
        conversation_id=conv_id,
        sender_id=current_user.id,
        content=content,
    )
    db.session.add(msg)
    db.session.commit()

    # Also push via WebSocket so any connected client sees it immediately
    from app import socketio  # late import avoids circular dependency
    socketio.emit("new_message", msg.to_dict(), room=conv_id)

    return jsonify(msg.to_dict()), 201
