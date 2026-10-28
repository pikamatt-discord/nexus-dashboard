from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db, User, AuditEvent
from ..security import verify_password, create_access_token, get_password_hash, get_current_user
from ..config import settings
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Auth"])

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    username: str

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    
    # Auto-seed admin user if no users exist
    if not user and db.query(User).count() == 0 and form_data.username == settings.ADMIN_USERNAME:
        if form_data.password == settings.ADMIN_PASSWORD:
            hashed = get_password_hash(settings.ADMIN_PASSWORD)
            user = User(username=settings.ADMIN_USERNAME, hashed_password=hashed)
            db.add(user)
            db.commit()
            db.refresh(user)

    if not user or not verify_password(form_data.password, user.hashed_password):
        audit = AuditEvent(
            level="WARNING",
            source="AUTH",
            message=f"Failed login attempt for username '{form_data.username}'"
        )
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    audit = AuditEvent(
        level="INFO",
        source="AUTH",
        message=f"User '{user.username}' logged in successfully.",
        user=user.username
    )
    db.add(audit)
    db.commit()

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username}
