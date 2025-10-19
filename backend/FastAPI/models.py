# models.py
from sqlalchemy import Column, Integer, String, Boolean, Text, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    avatar_url = Column(String, nullable=True)
    interests = Column(JSON, default=[])
    is_registered = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False) 
    settings = Column(JSON, nullable=True)
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)

class Chat(Base):
    __tablename__ = "chats"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    avatar_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, index=True)
    sender_id = Column(Integer, index=True)
    text = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())