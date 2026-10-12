"""
Product (listing) routes.
"""
from flask import Blueprint, request, jsonify
from database import db, Product
from auth_utils import require_auth
from image_utils import delete_image

products_bp = Blueprint("products", __name__)

VALID_CATEGORIES  = {"Books", "Electronics", "Furniture", "Clothing", "Sports", "Other"}
VALID_CONDITIONS  = {"New", "Like New", "Good", "Fair"}
VALID_EXCHANGE    = {"sell", "trade", "both"}
VALID_STATUS      = {"available", "reserved", "sold"}


@products_bp.get("/")
@require_auth
def list_products(current_user):
    """Return all available products with seller profile."""
    q = Product.query.order_by(Product.created_at.desc())
    products = q.all()
    return jsonify([p.to_dict(include_profile=True) for p in products])


@products_bp.get("/<product_id>")
@require_auth
def get_product(product_id, current_user):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Listing not found."}), 404
    return jsonify(product.to_dict(include_profile=True))


@products_bp.post("/")
@require_auth
def create_product(current_user):
    data = request.get_json(silent=True) or {}

    title         = (data.get("title") or "").strip()
    description   = (data.get("description") or "").strip()
    category      = data.get("category", "Other")
    condition     = data.get("condition", "Good")
    exchange_type = data.get("exchange_type", "both")
    image_url     = data.get("image_url")

    if not title or len(title) < 3:
        return jsonify({"error": "Title must be at least 3 characters."}), 400
    if not description or len(description) < 10:
        return jsonify({"error": "Description must be at least 10 characters."}), 400
    if category not in VALID_CATEGORIES:
        return jsonify({"error": "Invalid category."}), 400
    if condition not in VALID_CONDITIONS:
        return jsonify({"error": "Invalid condition."}), 400
    if exchange_type not in VALID_EXCHANGE:
        return jsonify({"error": "Invalid exchange type."}), 400

    try:
        price = float(data.get("price", 0))
        if price < 0 or price > 99999:
            raise ValueError()
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid price value."}), 400

    if exchange_type == "trade":
        price = 0.0

    product = Product(
        user_id=current_user.id,
        title=title,
        description=description,
        category=category,
        condition=condition,
        price=price,
        exchange_type=exchange_type,
        image_url=image_url,
        status="available",
    )
    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict(include_profile=True)), 201


@products_bp.patch("/<product_id>")
@require_auth
def update_product(product_id, current_user):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Listing not found."}), 404
    if product.user_id != current_user.id:
        return jsonify({"error": "Forbidden."}), 403

    data = request.get_json(silent=True) or {}

    if "title" in data:
        t = data["title"].strip()
        if len(t) < 3:
            return jsonify({"error": "Title too short."}), 400
        product.title = t
    if "description" in data:
        d = data["description"].strip()
        if len(d) < 10:
            return jsonify({"error": "Description too short."}), 400
        product.description = d
    if "category" in data:
        if data["category"] not in VALID_CATEGORIES:
            return jsonify({"error": "Invalid category."}), 400
        product.category = data["category"]
    if "condition" in data:
        if data["condition"] not in VALID_CONDITIONS:
            return jsonify({"error": "Invalid condition."}), 400
        product.condition = data["condition"]
    if "exchange_type" in data:
        if data["exchange_type"] not in VALID_EXCHANGE:
            return jsonify({"error": "Invalid exchange type."}), 400
        product.exchange_type = data["exchange_type"]
    if "price" in data:
        try:
            price = float(data["price"])
            if price < 0 or price > 99999:
                raise ValueError()
            product.price = price
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid price."}), 400
    if "status" in data:
        if data["status"] not in VALID_STATUS:
            return jsonify({"error": "Invalid status."}), 400
        product.status = data["status"]
    if "image_url" in data:
        product.image_url = data["image_url"]

    db.session.commit()
    return jsonify(product.to_dict(include_profile=True))


@products_bp.delete("/<product_id>")
@require_auth
def delete_product(product_id, current_user):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Listing not found."}), 404
    if product.user_id != current_user.id:
        return jsonify({"error": "Forbidden."}), 403

    # Remove the stored image file
    if product.image_url:
        delete_image(product.image_url)

    db.session.delete(product)
    db.session.commit()
    return jsonify({"success": True})
