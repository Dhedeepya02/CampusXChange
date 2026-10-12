"""
Image upload route — uses Pillow to resize/compress before saving.
"""
from flask import Blueprint, request, jsonify, current_app
from auth_utils import require_auth
from image_utils import save_image

images_bp = Blueprint("images", __name__)


@images_bp.post("/upload")
@require_auth
def upload_image(current_user):
    """
    Multipart upload endpoint.
    Field name: 'image'
    Returns: { "url": "/static/uploads/<filename>" }
    """
    if "image" not in request.files:
        return jsonify({"error": "No image file provided. Use field name 'image'."}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    try:
        url = save_image(file.stream, file.mimetype, file.filename)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.error("Image processing error: %s", e)
        return jsonify({"error": "Failed to process image."}), 500

    # Return absolute URL so the frontend can use it directly
    base = request.host_url.rstrip("/")
    return jsonify({"url": f"{base}{url}"}), 201
