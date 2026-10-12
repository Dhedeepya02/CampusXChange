"""
Server-side image processing using Pillow.

Mirrors what the original frontend did with canvas:
  1. Validate file type and size.
  2. Open with Pillow, convert to RGB.
  3. Resize so neither dimension exceeds MAX_DIMENSION (preserving aspect ratio).
  4. Save as JPEG at JPEG_QUALITY.
  5. Return the processed bytes + a suggested filename.
"""
import io
import os
import uuid
from PIL import Image

MAX_DIMENSION = 1024
JPEG_QUALITY  = 82          # 0-95; 82 ≈ 0.82 in the old canvas toBlob
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB

ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/jpg", "image/png",
    "image/webp", "image/gif", "image/bmp",
}

# Folder to store uploaded images (served as static files)
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "static", "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def process_image(file_stream, mimetype: str, original_filename: str) -> tuple[bytes, str]:
    """
    Process an uploaded image file.

    Args:
        file_stream: file-like object (from request.files['image'])
        mimetype: MIME type string from the uploaded file
        original_filename: original file name (used only for error messages)

    Returns:
        (jpeg_bytes, filename) tuple

    Raises:
        ValueError: if the file is invalid/too large
    """
    if mimetype not in ALLOWED_MIME_TYPES:
        raise ValueError("Please upload a JPEG, PNG, WebP, GIF, or BMP image.")

    raw = file_stream.read()
    if len(raw) > MAX_FILE_BYTES:
        raise ValueError("Image exceeds the 10 MB size limit.")

    try:
        img = Image.open(io.BytesIO(raw))
    except Exception:
        raise ValueError("The uploaded file could not be read as an image.")

    # Convert palette / RGBA to plain RGB so JPEG save works
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGB")
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # Resize if necessary
    w, h = img.size
    if w > MAX_DIMENSION or h > MAX_DIMENSION:
        ratio = min(MAX_DIMENSION / w, MAX_DIMENSION / h)
        new_w = max(1, round(w * ratio))
        new_h = max(1, round(h * ratio))
        img = img.resize((new_w, new_h), Image.LANCZOS)

    # Encode as JPEG
    out = io.BytesIO()
    img.save(out, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    jpeg_bytes = out.getvalue()

    filename = f"product_{uuid.uuid4().hex}.jpg"
    return jpeg_bytes, filename


def save_image(file_stream, mimetype: str, original_filename: str) -> str:
    """
    Process and persist an uploaded image to UPLOAD_FOLDER.

    Returns:
        The public URL path, e.g. '/static/uploads/<filename>'
    """
    jpeg_bytes, filename = process_image(file_stream, mimetype, original_filename)
    dest = os.path.join(UPLOAD_FOLDER, filename)
    with open(dest, "wb") as f:
        f.write(jpeg_bytes)
    return f"/static/uploads/{filename}"


def delete_image(image_url: str):
    """Remove a previously saved image file (best-effort; ignores missing)."""
    if not image_url or not image_url.startswith("/static/uploads/"):
        return
    filename = image_url.split("/")[-1]
    path = os.path.join(UPLOAD_FOLDER, filename)
    try:
        os.remove(path)
    except FileNotFoundError:
        pass
