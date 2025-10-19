# main.py
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
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

# Папка для загрузки аватарок
UPLOAD_DIR = "uploads/avatars"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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

class MemeResponse(BaseModel):
    id: int
    image_url: str
    title: Optional[str] = None
    height: Optional[int] = 300
    created_at: str
    
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
        
        if not user or not verify_password(login_data.password, user.password_hash):
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during login: {str(e)}")

# ----------------------------
# Эндпоинты пользователей (ВАЖНЫЙ ПОРЯДОК!)
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
        # Проверяем, не занят ли username другим пользователем
        existing_user = db.query(models.User).filter(
            models.User.username == user_data.username,
            models.User.id != current_user.id
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Обновляем username
        current_user.username = user_data.username
        db.commit()
        db.refresh(current_user)
        
        return {"message": "Username updated successfully", "user": current_user}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating username: {str(e)}")
@app.put("/users/update-email")
def update_email(
    user_data: EmailUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    try:
        # Проверяем текущий email (регистронезависимо)
        if current_user.email.lower() != user_data.currentEmail.lower():
            raise HTTPException(status_code=400, detail="Current email is incorrect")
        
        # Если новый email совпадает с текущим
        if current_user.email.lower() == user_data.newEmail.lower():
            raise HTTPException(status_code=400, detail="New email cannot be the same as current email")
        
        # Проверяем, не занят ли новый email другим пользователем
        existing_user = db.query(models.User).filter(
            models.User.email.lower() == user_data.newEmail.lower(),
            models.User.id != current_user.id
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Обновляем email
        current_user.email = user_data.newEmail
        current_user.is_verified = False  # Сбрасываем верификацию для нового email
        db.commit()
        db.refresh(current_user)
        
        return {"message": "Email updated successfully. Please verify your new email."}
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
        # Проверяем текущий пароль
        if not verify_password(user_data.currentPassword, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Проверяем, что новый пароль отличается от текущего
        if verify_password(user_data.newPassword, current_user.password_hash):
            raise HTTPException(status_code=400, detail="New password cannot be the same as current password")
        
        # Обновляем пароль
        current_user.password_hash = get_password_hash(user_data.newPassword)
        db.commit()
        
        return {"message": "Password updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating password: {str(e)}")

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

        # Полный URL
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
        # Сохраняем настройки в базе данных
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
@app.get("/users/{user_id}/memes")
def get_user_memes(user_id: int, type: str = "created", db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Заглушка для мемов
    memes_data = []
    
    if type == "created":
        memes_data = [
            {
                "id": 1,
                "image_url": f"https://picsum.photos/300/400?random={user_id}1",
                "title": f"Meme {user_id}-1",
                "height": 250,
                "created_at": "2024-01-01"
            },
            {
                "id": 2,
                "image_url": f"https://picsum.photos/300/400?random={user_id}2",
                "title": f"Meme {user_id}-2",
                "height": 300,
                "created_at": "2024-01-02"
            }
        ]
    else:  # saved
        memes_data = [
            {
                "id": 3,
                "image_url": f"https://picsum.photos/300/400?random={user_id}3",
                "title": f"Saved {user_id}-1",
                "height": 280,
                "created_at": "2024-01-03"
            }
        ]
    
    return {
        "user_id": user_id,
        "type": type,
        "memes": memes_data
    }

# ----------------------------
# Статические файлы
# ----------------------------
from fastapi.staticfiles import StaticFiles
# Обслуживаем аватарки из папки uploads/avatars
app.mount("/static/avatars", StaticFiles(directory="uploads/avatars"), name="avatars")
# И другие статические файлы если нужно
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# ----------------------------
# Корневой эндпоинт
# ----------------------------
@app.get("/")
def read_root():
    return {"message": "Meme App API is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)