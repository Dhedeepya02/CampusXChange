"""
Test authentication directly
"""
import bcrypt
from app import create_app
from database import db, User

app = create_app()

with app.app_context():
    # Test with user1
    email = "user1@campus.edu"
    password = "password1"
    
    user = User.query.filter_by(email=email).first()
    if user:
        print(f"Found user: {user.email}")
        print(f"Password hash: {user.password_hash}")
        
        # Test password verification
        try:
            result = bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8'))
            print(f"Password verification result: {result}")
        except Exception as e:
            print(f"Error during password verification: {e}")
            print(f"Error type: {type(e)}")
    else:
        print("User not found")
