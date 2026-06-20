from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from bson import ObjectId
from core.security import decode_token
from db.database import get_database

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db=Depends(get_database)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise credentials_exception
    user_id = payload.get("sub")
    if not user_id:
        raise credentials_exception
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise credentials_exception
    user["id"] = str(user["_id"])
    return user

async def get_project_or_404(
    project_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_database)
):
    try:
        project = await db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Project not found")
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if str(project["user_id"]) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    project["id"] = str(project["_id"])
    return project
