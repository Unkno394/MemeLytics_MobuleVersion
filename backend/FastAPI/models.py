# models.py
from sqlalchemy import Column, Integer, String, Boolean, Text, JSON, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

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
    
    # Relationship to memes
    memes = relationship("Meme", back_populates="owner")

class Meme(Base):
    __tablename__ = "memes"
    
    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String, nullable=False)
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    width = Column(Integer, default=360)
    height = Column(Integer, default=300)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    likes_count = Column(Integer, default=0)
    tags = Column(JSON, default=[])
    is_featured = Column(Boolean, default=False)
    # Relationship
    owner = relationship("User", back_populates="memes")

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