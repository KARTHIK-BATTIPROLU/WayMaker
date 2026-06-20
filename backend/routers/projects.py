from fastapi import APIRouter, Depends, HTTPException
from typing import List
from bson import ObjectId
from datetime import datetime, timezone
from models.project import ProjectCreate, ProjectUpdate, ProjectOut
from core.dependencies import get_current_user, get_project_or_404
from db.database import get_database

router = APIRouter()

def serialize_project(p: dict) -> ProjectOut:
    return ProjectOut(
        id=str(p["_id"]),
        userId=str(p["user_id"]),
        name=p.get("name", ""),
        idea=p.get("idea", ""),
        industry=p.get("industry"),
        targetAudience=p.get("targetAudience"),
        location=p.get("location"),
        marketResearch=p.get("marketResearch"),
        competitors=p.get("competitors", []),
        websiteCode=p.get("websiteCode"),
        marketingKit=p.get("marketingKit", []),
        fundingOpportunities=p.get("fundingOpportunities", []),
        competitorAnalytics=p.get("competitorAnalytics", []),
        webhookUrl=p.get("webhookUrl"),
        zapierWebhookUrl=p.get("zapierWebhookUrl"),
        createdAt=p["createdAt"],
        updatedAt=p["updatedAt"]
    )

@router.get("", response_model=List[ProjectOut])
async def list_projects(current_user=Depends(get_current_user), db=Depends(get_database)):
    cursor = db.projects.find(
        {"user_id": ObjectId(current_user["id"])},
        sort=[("createdAt", -1)]
    )
    projects = await cursor.to_list(length=100)
    return [serialize_project(p) for p in projects]

@router.post("", response_model=ProjectOut)
async def create_project(body: ProjectCreate, current_user=Depends(get_current_user), db=Depends(get_database)):
    name = " ".join(body.idea.strip().split()[:4])
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": ObjectId(current_user["id"]),
        "name": name,
        "idea": body.idea,
        "industry": body.industry,
        "targetAudience": body.targetAudience,
        "location": body.location,
        "marketResearch": None,
        "competitors": [],
        "websiteCode": None,
        "marketingKit": [],
        "fundingOpportunities": [],
        "competitorAnalytics": [],
        "webhookUrl": None,
        "zapierWebhookUrl": None,
        "createdAt": now,
        "updatedAt": now
    }
    result = await db.projects.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_project(doc)

@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project=Depends(get_project_or_404)):
    return serialize_project(project)

@router.patch("/{project_id}", response_model=ProjectOut)
async def update_project(body: ProjectUpdate, project=Depends(get_project_or_404), db=Depends(get_database)):
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        return serialize_project(project)
    # Convert Pydantic models to dicts for MongoDB
    for key in ["competitors", "marketingKit", "fundingOpportunities"]:
        if key in update_data and update_data[key]:
            update_data[key] = [item.model_dump() if hasattr(item, 'model_dump') else item for item in update_data[key]]
    update_data["updatedAt"] = datetime.now(timezone.utc)
    await db.projects.update_one(
        {"_id": ObjectId(project["id"])},
        {"$set": update_data}
    )
    updated = await db.projects.find_one({"_id": ObjectId(project["id"])})
    return serialize_project(updated)

@router.delete("/{project_id}")
async def delete_project(project=Depends(get_project_or_404), db=Depends(get_database)):
    await db.projects.delete_one({"_id": ObjectId(project["id"])})
    await db.chat_messages.delete_many({"project_id": ObjectId(project["id"])})
    return {"deleted": True}
