"""
CampusXChange - Main Flask Application Entry Point
"""
import os
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

load_dotenv()

# SocketIO instance – created here so routes can import it without circular deps
socketio = SocketIO(cors_allowed_origins="*", async_mode="threading", manage_session=True)


def create_app():
    app = Flask(__name__)

    # ── Config ──────────────────────────────────────────────────────────────
    app.config["SECRET_KEY"] = os.getenv("JWT_SECRET", "dev-secret-change-me")
    # Use SQLite for local development (no MySQL required)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///campusxchange.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB upload limit

    # ── Extensions ──────────────────────────────────────────────────────────
    from database import db
    db.init_app(app)

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    CORS(
        app,
        resources={r"/api/*": {"origins": frontend_url}},
        supports_credentials=True,
    )

    socketio.init_app(app)

    # ── Blueprints ───────────────────────────────────────────────────────────
    from routes.auth          import auth_bp
    from routes.products      import products_bp
    from routes.offers        import offers_bp
    from routes.conversations import conversations_bp
    from routes.messages      import messages_bp
    from routes.profile       import profile_bp
    from routes.images        import images_bp

    app.register_blueprint(auth_bp,           url_prefix="/api/auth")
    app.register_blueprint(products_bp,       url_prefix="/api/products")
    app.register_blueprint(offers_bp,         url_prefix="/api/offers")
    app.register_blueprint(conversations_bp,  url_prefix="/api/conversations")
    app.register_blueprint(messages_bp,       url_prefix="/api/messages")
    app.register_blueprint(profile_bp,        url_prefix="/api/profile")
    app.register_blueprint(images_bp,         url_prefix="/api/images")

    # ── Create DB tables if they don't exist ──────────────────────────────
    with app.app_context():
        db.create_all()

    # ── Socket.IO event handlers ──────────────────────────────────────────
    from socket_events import register_socket_events
    register_socket_events(socketio)

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    socketio.run(
        app,
        host="0.0.0.0",
        port=port,
        debug=os.getenv("FLASK_DEBUG", "True") == "True",
        allow_unsafe_werkzeug=True,
    )
