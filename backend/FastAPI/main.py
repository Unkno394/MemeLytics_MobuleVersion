from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict
import models
from database import get_db, create_tables
from auth import get_password_hash, verify_password, create_access_token, verify_token
import shutil
import os
import uuid
import json
from datetime import datetime
from sqlalchemy import or_

app = FastAPI(title="Meme App API")

# OAuth2 схема для аутентификации
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# CORS для мобильного приложения
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Пересоздаем таблицы при запуске
print("Recreating database tables...")
create_tables()

# Папки для загрузки
UPLOAD_DIR = "uploads/avatars"
MEME_UPLOAD_DIR = "uploads/memes"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(MEME_UPLOAD_DIR, exist_ok=True)

# ----------------------------
# Pydantic схемы
# ----------------------------
class UserBase(BaseModel):
    email: str
    username: str

class UserCreate(UserBase):
    password: str
    interests: Optional[List[str]] = []

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: int
    avatar_url: Optional[str] = None
    interests: List[str] = []
    is_registered: bool = True
    followers_count: int = 0
    following_count: int = 0
    likes_count: int = 0
    settings: Optional[Dict] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UsernameUpdate(BaseModel):
    username: str

class EmailUpdate(BaseModel):
    currentEmail: str
    newEmail: str

class PasswordUpdate(BaseModel):
    currentPassword: str
    newPassword: str

class UserSettings(BaseModel):
    notifications: Dict
    privacy: Dict
    theme: str

class MemeCreate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class MemeResponse(BaseModel):
    id: int
    image_url: str
    title: Optional[str] = None
    description: Optional[str] = None
    width: Optional[int] = 360  # Добавляем ширину
    height: Optional[int] = 300
    created_at: str
    owner_id: int
    likes_count: int
    tags: List[str] = []
    is_featured: bool = False
    class Config:
        from_attributes = True

# ----------------------------
# Вспомогательные функции
# ----------------------------
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = verify_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = int(payload.get("sub"))
        user = db.query(models.User).filter(models.User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

# ----------------------------
# Эндпоинты аутентификации
# ----------------------------

@app.get("/check-email")
def check_email(email: str, db: Session = Depends(get_db)):
    """
    Проверяет, существует ли указанный email.
    Возвращает {"exists": true} или {"exists": false}
    """
    try:
        existing_user = db.query(models.User).filter(models.User.email.ilike(email)).first()
        return {"exists": bool(existing_user)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking email: {str(e)}")


@app.get("/check-username")
def check_username(username: str, db: Session = Depends(get_db)):
    """
    Проверяет, существует ли указанный username.
    Возвращает {"exists": true} или {"exists": false}
    """
    try:
        existing_user = db.query(models.User).filter(models.User.username.ilike(username)).first()
        return {"exists": bool(existing_user)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking username: {str(e)}")

@app.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        hashed_password = get_password_hash(user_data.password)
        db_user = models.User(
            email=user_data.email,
            password_hash=hashed_password,
            username=user_data.username,
            interests=user_data.interests or []
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        access_token = create_access_token(data={"sub": str(db_user.id)})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": db_user
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error during registration: {str(e)}")

@app.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.email == login_data.email).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        access_token = create_access_token(data={"sub": str(user.id)})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during login: {str(e)}")


# ----------------------------
# Эндпоинты пользователей
# ----------------------------
@app.get("/users/me", response_model=UserResponse)
def get_current_user_endpoint(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ----------------------------
# Эндпоинты обновления профиля
# ----------------------------
@app.put("/users/update-username")
def update_username(
    user_data: UsernameUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    try:
        existing_user = db.query(models.User).filter(
            models.User.username == user_data.username,
            models.User.id != current_user.id
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        current_user.username = user_data.username
        db.commit()
        db.refresh(current_user)
        
        return {"message": "Username updated successfully", "user": current_user}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        if "username" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(status_code=400, detail="Username already taken")
        raise HTTPException(status_code=500, detail=f"Error updating username: {str(e)}")

@app.put("/users/update-email")
def update_email(
    user_data: EmailUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    try:
        db_user = db.query(models.User).filter(models.User.id == current_user.id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_email_from_db = db_user.email
        if current_email_from_db.lower() != user_data.currentEmail.lower():
            raise HTTPException(status_code=400, detail="Current email is incorrect")
        
        if current_email_from_db.lower() == user_data.newEmail.lower():
            raise HTTPException(status_code=400, detail="New email cannot be the same as current email")
        
        existing_user = db.query(models.User).filter(
            models.User.email.ilike(user_data.newEmail),
            models.User.id != current_user.id
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        db_user.email = user_data.newEmail.lower()
        db_user.is_verified = False
        db.commit()
        db.refresh(db_user)
        
        return {"message": "Email updated successfully. Please verify your new email."}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating email: {str(e)}")

@app.put("/users/update-password")
def update_password(
    user_data: PasswordUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    try:
        if not user_data.currentPassword or not user_data.newPassword:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="All fields are required"
            )
        
        if not verify_password(user_data.currentPassword, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        if len(user_data.newPassword) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 6 characters long"
            )
        
        if verify_password(user_data.newPassword, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password cannot be the same as current password"
            )
        
        current_user.password_hash = get_password_hash(user_data.newPassword)
        db.commit()
        
        return {"message": "Password updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Full error updating password: {str(e)}")
        print(f"Error type: {type(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating password. Please try again."
        )

@app.post("/users/upload-avatar")
async def upload_avatar(
    avatar: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        if not avatar.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        file_extension = avatar.filename.split('.')[-1] if '.' in avatar.filename else 'jpg'
        filename = f"{current_user.id}_{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(avatar.file, buffer)

        base_url = "http://192.168.1.18:8000"
        avatar_url = f"{base_url}/static/avatars/{filename}"

        current_user.avatar_url = avatar_url
        db.commit()
        db.refresh(current_user)

        return {"avatar_url": avatar_url, "message": "Avatar uploaded successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error uploading avatar: {str(e)}")

@app.put("/users/settings")
def update_settings(
    settings_data: UserSettings,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        current_user.settings = {
            "notifications": settings_data.notifications,
            "privacy": settings_data.privacy,
            "theme": settings_data.theme
        }
        db.commit()
        
        return {"message": "Settings updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating settings: {str(e)}")

# ----------------------------
# Эндпоинты мемов
# ----------------------------
@app.get("/search/memes")
def search_memes(q: str = "", db: Session = Depends(get_db)):
    """Поиск мемов по описанию и хэштегам"""
    try:
        if not q:
            return []
        
        search_query = f"%{q}%"
        
        # Улучшенный поиск: ищем по описанию ИЛИ по хэштегам (без #)
        clean_query = q.strip().lstrip('#')  # Убираем # если есть
        
        memes = db.query(models.Meme).filter(
            or_(
                models.Meme.description.ilike(search_query),
                # Ищем в массиве tags - любой элемент массива содержит запрос
                models.Meme.tags.any(clean_query)
            )
        ).order_by(models.Meme.created_at.desc()).all()
        
        print(f"🔍 Search query: '{q}', clean: '{clean_query}', found: {len(memes)} memes")
        
        # Преобразуем для ответа
        memes_data = []
        for meme in memes:
            meme_dict = {
                "id": meme.id,
                "image_url": meme.image_url,
                "title": meme.title,
                "description": meme.description,
                "width": meme.width or 360,
                "height": meme.height or 300,
                "created_at": meme.created_at.isoformat() if meme.created_at else "",
                "owner_id": meme.owner_id,
                "likes_count": meme.likes_count or 0,
                "tags": meme.tags or [],
                "is_featured": meme.is_featured
            }
            memes_data.append(meme_dict)
        
        return memes_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching memes: {str(e)}")

@app.get("/search/users")
def search_users(q: str = "", db: Session = Depends(get_db)):
    """Поиск пользователей по никнейму"""
    try:
        if not q:
            return []
        
        search_query = f"%{q}%"
        
        users = db.query(models.User).filter(
            models.User.username.ilike(search_query)
        ).all()
        
        print(f"🔍 User search query: '{q}', found: {len(users)} users")
        
        return users
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching users: {str(e)}")

@app.get("/feed/featured", response_model=List[MemeResponse])
def get_featured_memes(db: Session = Depends(get_db)):
    """Получить рекомендованные мемы (каждый 5-й пост)"""
    try:
        featured_memes = db.query(models.Meme).filter(
            models.Meme.is_featured == True
        ).order_by(models.Meme.created_at.desc()).all()
        
        # Преобразуем для ответа
        memes_data = []
        for meme in featured_memes:
            meme_dict = {
                "id": meme.id,
                "image_url": meme.image_url,
                "title": meme.title,
                "description": meme.description,
                "width": meme.width or 360,
                "height": meme.height or 300,
                "created_at": meme.created_at.isoformat() if meme.created_at else "",
                "owner_id": meme.owner_id,
                "likes_count": meme.likes_count or 0,
                "tags": meme.tags or [],
                "is_featured": meme.is_featured
            }
            memes_data.append(meme_dict)
        
        print(f"🎯 Found {len(featured_memes)} featured memes")
        return memes_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting featured memes: {str(e)}")

@app.post("/memes", response_model=MemeResponse)
async def create_meme(
    title: str = Form(None),
    description: str = Form(None),
    tags: str = Form("[]"),
    width: str = Form(None),
    height: str = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Парсим tags
        try:
            tags_list = json.loads(tags) if tags else []
        except:
            tags_list = []

        # Преобразуем ширину и высоту в числа
        try:
            meme_width = int(width) if width and width != "null" else 360
        except:
            meme_width = 360

        try:
            meme_height = int(height) if height and height != "null" else 300
        except:
            meme_height = 300

        print(f"📐 Creating meme with dimensions: {meme_width}x{meme_height}")

        # ЛОГИКА ДЛЯ РЕКОМЕНДАЦИЙ: каждый 5-й пост
        total_user_memes = db.query(models.Meme).filter(models.Meme.owner_id == current_user.id).count()
        is_featured = (total_user_memes + 1) % 5 == 0  # Каждый 5-й пост
        
        print(f"🎯 Featured logic: user has {total_user_memes} memes, new meme featured: {is_featured}")

        # Сохраняем изображение
        file_extension = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
        filename = f"{current_user.id}_{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(MEME_UPLOAD_DIR, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        # Создаем URL
        base_url = "http://192.168.1.18:8000"
        image_url = f"{base_url}/static/memes/{filename}"

        # Создаем мем в базе с реальными размерами
        db_meme = models.Meme(
            image_url=image_url,
            title=title,
            description=description,
            width=meme_width,
            height=meme_height,
            owner_id=current_user.id,
            tags=tags_list,
            is_featured=is_featured  # ← ДОБАВЬТЕ ЭТО
        )
        
        db.add(db_meme)
        db.commit()
        db.refresh(db_meme)

        # Возвращаем данные с реальными размерами
        meme_response = {
            "id": db_meme.id,
            "image_url": db_meme.image_url,
            "title": db_meme.title,
            "description": db_meme.description,
            "width": db_meme.width,
            "height": db_meme.height,
            "created_at": db_meme.created_at.isoformat() if db_meme.created_at else "",
            "owner_id": db_meme.owner_id,
            "likes_count": db_meme.likes_count,
            "tags": db_meme.tags or [],
            "is_featured": db_meme.is_featured  # ← ДОБАВЬТЕ ЭТО
        }
        
        print(f"✅ Meme created successfully: {meme_response}")
        return MemeResponse.model_validate(meme_response)

    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка создания мема: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating meme: {str(e)}")
    
@app.get("/users/{user_id}/memes", response_model=Dict)
def get_user_memes(user_id: int, type: str = "created", db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if type == "created":
        memes = db.query(models.Meme).filter(models.Meme.owner_id == user_id).order_by(models.Meme.created_at.desc()).all()
        
        # Преобразуем объекты Meme в словари
        memes_data = []
        for meme in memes:
            meme_dict = {
                "id": meme.id,
                "image_url": meme.image_url,
                "title": meme.title,
                "description": meme.description,
                "width": meme.width or 360,      # Используем сохраненную ширину
                "height": meme.height or 300,    # Используем сохраненную высоту
                "created_at": meme.created_at.isoformat() if meme.created_at else "",
                "owner_id": meme.owner_id,
                "likes_count": meme.likes_count or 0,
                "tags": meme.tags or []
            }
            memes_data.append(meme_dict)
    else:  # saved - пока заглушка
        memes_data = []
    
    return {
        "user_id": user_id,
        "type": type,
        "memes": memes_data
    }

@app.get("/memes/{meme_id}", response_model=MemeResponse)
def get_meme(meme_id: int, db: Session = Depends(get_db)):
    meme = db.query(models.Meme).filter(models.Meme.id == meme_id).first()
    if not meme:
        raise HTTPException(status_code=404, detail="Meme not found")
    
    # Преобразуем для ответа с преобразованием datetime
    meme_response = {
        "id": meme.id,
        "image_url": meme.image_url,
        "title": meme.title,
        "description": meme.description,
        "height": meme.height,
        "created_at": meme.created_at.isoformat() if meme.created_at else "",
        "owner_id": meme.owner_id,
        "likes_count": meme.likes_count,
        "tags": meme.tags or []
    }
    
    return MemeResponse.model_validate(meme_response)

# ----------------------------
# Статические файлы
# ----------------------------
from fastapi.staticfiles import StaticFiles
app.mount("/static/avatars", StaticFiles(directory="uploads/avatars"), name="avatars")
app.mount("/static/memes", StaticFiles(directory="uploads/memes"), name="memes")

# ----------------------------
# Корневой эндпоинт
# ----------------------------
@app.get("/")
def read_root():
    return {"message": "Meme App API is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)