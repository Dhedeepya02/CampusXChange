"""
Check if database exists and has users
"""
import os
from app import create_app
from database import db, User

app = create_app()

with app.app_context():
    users = User.query.all()
    print(f"Total users in database: {len(users)}")
    for user in users:
        print(f"User: {user.email}, Password hash: {user.password_hash[:50]}...")
    
    # Check database file location
    db_path = app.config.get('SQLALCHEMY_DATABASE_URI')
    print(f"\nDatabase URI: {db_path}")
