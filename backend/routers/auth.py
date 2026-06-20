from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone
from models.user import UserCreate, UserLogin, UserOut, TokenResponse
from core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from db.database import get_database

router = APIRouter()

def serialize_user(user: dict) -> UserOut:
    return UserOut(id=str(user["_id"]), email=user["email"], created_at=user["created_at"])

@router.post("/register", response_model=TokenResponse)
async def register(body: UserCreate, response: Response, db=Depends(get_database)):
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    user_id = str(result.inserted_id)
    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})
    response.set_cookie(
        key="refresh_token", value=refresh_token,
        httponly=True, secure=False, samesite="lax",
        path="/api/auth/refresh", max_age=60*60*24*7
    )
    return TokenResponse(access_token=access_token, user=serialize_user(user_doc))

@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, response: Response, db=Depends(get_database)):
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user_id = str(user["_id"])
    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})
    response.set_cookie(
        key="refresh_token", value=refresh_token,
        httponly=True, secure=False, samesite="lax",
        path="/api/auth/refresh", max_age=60*60*24*7
    )
    return TokenResponse(access_token=access_token, user=serialize_user(user))

@router.post("/refresh")
async def refresh_token(response: Response, refresh_token: Optional[str] = Cookie(None), db=Depends(get_database)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user_id = payload.get("sub")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    new_access_token = create_access_token({"sub": user_id})
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token", path="/api/auth/refresh")
    return {"message": "Logged out"}
