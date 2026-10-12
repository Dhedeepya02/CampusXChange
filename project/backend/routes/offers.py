"""
Offer routes: make, list, accept, reject.
"""
from flask import Blueprint, request, jsonify
from database import db, Offer, Product
from auth_utils import require_auth

offers_bp = Blueprint("offers", __name__)


@offers_bp.get("/product/<product_id>")
@require_auth
def get_offers_for_product(product_id, current_user):
    """Return offers on a product (owner sees all; buyer sees their own)."""
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found."}), 404

    if product.user_id == current_user.id:
        # Seller: see all offers with buyer details
        offers = Offer.query.filter_by(product_id=product_id).order_by(Offer.created_at.desc()).all()
        return jsonify([o.to_dict(include_details=True) for o in offers])
    else:
        # Buyer: see only their own offers
        offers = Offer.query.filter_by(product_id=product_id, buyer_id=current_user.id).order_by(Offer.created_at.desc()).all()
        return jsonify([o.to_dict() for o in offers])


@offers_bp.post("/")
@require_auth
def create_offer(current_user):
    data = request.get_json(silent=True) or {}

    product_id    = data.get("product_id", "")
    offer_type    = data.get("offer_type", "purchase")
    offer_message = (data.get("offer_message") or "").strip() or None

    if not product_id:
        return jsonify({"error": "product_id is required."}), 400

    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found."}), 404
    if product.user_id == current_user.id:
        return jsonify({"error": "You cannot make an offer on your own listing."}), 400
    if product.status != "available":
        return jsonify({"error": "This listing is no longer available."}), 400

    offer_price = None
    if offer_type == "purchase":
        try:
            offer_price = float(data.get("offer_price", 0))
            if offer_price < 0:
                raise ValueError()
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid offer price."}), 400

    # Check for duplicate pending offer
    existing = Offer.query.filter_by(
        product_id=product_id, buyer_id=current_user.id, status="pending"
    ).first()
    if existing:
        return jsonify({"error": "You already have a pending offer on this item."}), 409

    offer = Offer(
        product_id=product_id,
        buyer_id=current_user.id,
        offer_type=offer_type,
        offer_price=offer_price,
        offer_message=offer_message,
        status="pending",
    )
    db.session.add(offer)
    db.session.commit()
    return jsonify(offer.to_dict()), 201


@offers_bp.patch("/<offer_id>")
@require_auth
def update_offer_status(offer_id, current_user):
    """Seller accepts/rejects; buyer withdraws."""
    offer = db.session.get(Offer, offer_id)
    if not offer:
        return jsonify({"error": "Offer not found."}), 404

    data   = request.get_json(silent=True) or {}
    status = data.get("status", "")

    product = db.session.get(Product, offer.product_id)
    is_seller = product and product.user_id == current_user.id
    is_buyer  = offer.buyer_id == current_user.id

    if not is_seller and not is_buyer:
        return jsonify({"error": "Forbidden."}), 403

    if is_seller and status in ("accepted", "rejected"):
        offer.status = status
    elif is_buyer and status == "withdrawn":
        offer.status = "withdrawn"
    else:
        return jsonify({"error": "Invalid status transition."}), 400

    db.session.commit()
    return jsonify(offer.to_dict())
