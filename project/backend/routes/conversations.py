"""
Conversation routes: create and list conversations.
"""
from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from database import db, Conversation, Product
from auth_utils import require_auth

conversations_bp = Blueprint("conversations", __name__)


@conversations_bp.get("/")
@require_auth
def list_conversations(current_user):
    """Return all conversations the current user participates in."""
    convs = (
        Conversation.query
        .filter(
            (Conversation.buyer_id == current_user.id) |
            (Conversation.seller_id == current_user.id)
        )
        .order_by(Conversation.created_at.desc())
        .all()
    )
    return jsonify([c.to_dict(include_details=True) for c in convs])


@conversations_bp.get("/<conv_id>")
@require_auth
def get_conversation(conv_id, current_user):
    conv = db.session.get(Conversation, conv_id)
    if not conv:
        return jsonify({"error": "Conversation not found."}), 404
    if conv.buyer_id != current_user.id and conv.seller_id != current_user.id:
        return jsonify({"error": "Forbidden."}), 403
    return jsonify(conv.to_dict(include_details=True))


@conversations_bp.post("/")
@require_auth
def create_conversation(current_user):
    """
    Start a new conversation about a product, or return the existing one.
    Body: { product_id }
    """
    data       = request.get_json(silent=True) or {}
    product_id = data.get("product_id", "")

    if not product_id:
        return jsonify({"error": "product_id is required."}), 400

    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found."}), 404
    if product.user_id == current_user.id:
        return jsonify({"error": "You cannot message yourself."}), 400

    # Return existing conversation if it already exists
    existing = Conversation.query.filter_by(
        product_id=product_id, buyer_id=current_user.id
    ).first()
    if existing:
        return jsonify(existing.to_dict(include_details=True))

    conv = Conversation(
        product_id=product_id,
        buyer_id=current_user.id,
        seller_id=product.user_id,
    )
    db.session.add(conv)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        existing = Conversation.query.filter_by(
            product_id=product_id, buyer_id=current_user.id
        ).first()
        return jsonify(existing.to_dict(include_details=True))

    return jsonify(conv.to_dict(include_details=True)), 201
