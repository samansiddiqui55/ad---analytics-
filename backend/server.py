from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import random
import asyncio
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-frontend-domain.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
# mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
# client = AsyncIOMotorClient(mongo_url)
# db = client[os.environ['DB_NAME']]

mongo_url = os.environ.get(
    "MONGO_URL",
    "mongodb://localhost:27017"
)

db_name = os.environ.get(
    "DB_NAME",
    "ad_campaign_db"
)

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]


# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
security = HTTPBearer()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logging.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logging.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logging.error(f"Error broadcasting to client: {e}")

manager = ConnectionManager()

# Create the main app
app = FastAPI(title="Ad Campaign Analytics API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ========== Models ==========

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    full_name: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Campaign(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    external_id: str
    name: str
    platform: str
    status: str
    budget: float
    created_at: datetime

class PerformanceMetric(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    campaign_id: str
    campaign_name: str
    platform: str
    date: str
    impressions: int
    clicks: int
    conversions: int
    cost: float
    revenue: float
    ctr: float
    cpc: float
    cpa: float
    roas: float

class CampaignSummary(BaseModel):
    total_campaigns: int
    google_ads_campaigns: int
    facebook_ads_campaigns: int
    total_spend: float
    total_revenue: float
    total_roas: float
    total_impressions: int
    total_clicks: int
    total_conversions: int

class RealtimeUpdate(BaseModel):
    type: str
    data: dict
    timestamp: datetime

# ========== Auth Helpers ==========

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        if not credentials:
            raise HTTPException(status_code=401, detail="Authentication required")
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# ========== Mock Data Generators ==========

def generate_mock_campaigns(platform: str, count: int = 5):
    campaigns = []
    statuses = ["ACTIVE", "PAUSED", "ENABLED"]
    
    for i in range(count):
        campaign_id = f"{platform}_{uuid.uuid4().hex[:12]}"
        campaigns.append({
            "id": campaign_id,
            "external_id": campaign_id,
            "name": f"{platform.replace('_', ' ').title()} Campaign {i+1}",
            "platform": platform,
            "status": random.choice(statuses),
            "budget": round(random.uniform(1000, 10000), 2),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    return campaigns

def generate_mock_performance(campaign_id: str, campaign_name: str, platform: str, days: int = 30):
    metrics = []
    base_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    for i in range(days):
        date = base_date + timedelta(days=i)
        impressions = random.randint(1000, 50000)
        clicks = random.randint(50, int(impressions * 0.05))
        conversions = random.randint(5, int(clicks * 0.1))
        cost = round(random.uniform(100, 1000), 2)
        revenue = round(cost * random.uniform(0.8, 3.5), 2)
        
        ctr = (clicks / impressions * 100) if impressions > 0 else 0
        cpc = (cost / clicks) if clicks > 0 else 0
        cpa = (cost / conversions) if conversions > 0 else 0
        roas = (revenue / cost) if cost > 0 else 0
        
        metrics.append({
            "id": str(uuid.uuid4()),
            "campaign_id": campaign_id,
            "campaign_name": campaign_name,
            "platform": platform,
            "date": date.strftime("%Y-%m-%d"),
            "impressions": impressions,
            "clicks": clicks,
            "conversions": conversions,
            "cost": cost,
            "revenue": revenue,
            "ctr": round(ctr, 2),
            "cpc": round(cpc, 2),
            "cpa": round(cpa, 2),
            "roas": round(roas, 2)
        })
    
    return metrics

def generate_realtime_update(campaign_id: str, campaign_name: str, platform: str):
    """Generate a single real-time performance update"""
    impressions = random.randint(100, 5000)
    clicks = random.randint(5, int(impressions * 0.05))
    conversions = random.randint(1, int(clicks * 0.1))
    cost = round(random.uniform(10, 100), 2)
    revenue = round(cost * random.uniform(0.8, 3.5), 2)
    
    ctr = (clicks / impressions * 100) if impressions > 0 else 0
    cpc = (cost / clicks) if clicks > 0 else 0
    cpa = (cost / conversions) if conversions > 0 else 0
    roas = (revenue / cost) if cost > 0 else 0
    
    return {
        "campaign_id": campaign_id,
        "campaign_name": campaign_name,
        "platform": platform,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "impressions": impressions,
        "clicks": clicks,
        "conversions": conversions,
        "cost": cost,
        "revenue": revenue,
        "ctr": round(ctr, 2),
        "cpc": round(cpc, 2),
        "cpa": round(cpa, 2),
        "roas": round(roas, 2)
    }

# ========== Background Task for Real-time Updates ==========

async def broadcast_realtime_updates():
    """Background task to send real-time updates every 10 seconds"""
    while True:
        try:
            await asyncio.sleep(10)  # Update every 10 seconds
            
            # Get random campaign for update
            campaigns = await db.campaigns.find({}, {"_id": 0}).to_list(100)
            if campaigns and len(manager.active_connections) > 0:
                campaign = random.choice(campaigns)
                
                # Generate real-time update
                update_data = generate_realtime_update(
                    campaign["id"],
                    campaign["name"],
                    campaign["platform"]
                )
                
                # Broadcast to all connected clients
                await manager.broadcast({
                    "type": "performance_update",
                    "data": update_data
                })
                
                logging.info(f"Broadcast real-time update for campaign: {campaign['name']}")
        except Exception as e:
            logging.error(f"Error in broadcast_realtime_updates: {e}")
            await asyncio.sleep(10)

# ========== WebSocket Route ==========

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial connection message
        await websocket.send_json({
            "type": "connection_established",
            "message": "Real-time updates connected",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        while True:
            # Keep connection alive and listen for messages
            data = await websocket.receive_text()
            # Echo back any messages received
            await websocket.send_json({
                "type": "echo",
                "message": f"Received: {data}"
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# ========== Auth Routes ==========

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user = {
        "id": user_id,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": hashed_password,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    
    access_token = create_access_token(data={"sub": user_id})
    
    user_response = User(
        id=user_id,
        email=user_data.email,
        full_name=user_data.full_name,
        created_at=datetime.fromisoformat(user["created_at"])
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    user_response = User(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        created_at=datetime.fromisoformat(user["created_at"])
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ========== Campaign Routes ==========

@api_router.get("/campaigns", response_model=List[Campaign])
async def get_campaigns(
    platform: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {"user_id": current_user.id}
    if platform:
        query["platform"] = platform
    
    campaigns = await db.campaigns.find(query, {"_id": 0}).to_list(1000)
    
    if not campaigns:
        google_campaigns = generate_mock_campaigns("google_ads", 5)
        facebook_campaigns = generate_mock_campaigns("facebook_ads", 4)
        
        all_campaigns = google_campaigns + facebook_campaigns
        for campaign in all_campaigns:
            campaign["user_id"] = current_user.id
            await db.campaigns.insert_one(campaign)
        
        campaigns = all_campaigns
    
    return [Campaign(**c) for c in campaigns]

@api_router.get("/campaigns/summary", response_model=CampaignSummary)
async def get_campaign_summary(current_user: User = Depends(get_current_user)):
    campaigns = await db.campaigns.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    google_count = sum(1 for c in campaigns if c["platform"] == "google_ads")
    facebook_count = sum(1 for c in campaigns if c["platform"] == "facebook_ads")
    
    # Get performance metrics
    metrics = await db.performance_metrics.find(
        {"campaign_id": {"$in": [c["id"] for c in campaigns]}},
        {"_id": 0}
    ).to_list(10000)
    
    total_spend = sum(m.get("cost", 0) for m in metrics)
    total_revenue = sum(m.get("revenue", 0) for m in metrics)
    total_roas = (total_revenue / total_spend) if total_spend > 0 else 0
    total_impressions = sum(m.get("impressions", 0) for m in metrics)
    total_clicks = sum(m.get("clicks", 0) for m in metrics)
    total_conversions = sum(m.get("conversions", 0) for m in metrics)
    
    return CampaignSummary(
        total_campaigns=len(campaigns),
        google_ads_campaigns=google_count,
        facebook_ads_campaigns=facebook_count,
        total_spend=round(total_spend, 2),
        total_revenue=round(total_revenue, 2),
        total_roas=round(total_roas, 2),
        total_impressions=total_impressions,
        total_clicks=total_clicks,
        total_conversions=total_conversions
    )

# ========== Performance Routes ==========

@api_router.get("/performance", response_model=List[PerformanceMetric])
async def get_performance(
    campaign_id: Optional[str] = None,
    platform: Optional[str] = None,
    days: int = 30,
    current_user: User = Depends(get_current_user)
):
    query = {}
    
    if campaign_id:
        query["campaign_id"] = campaign_id
    elif platform:
        query["platform"] = platform
    
    metrics = await db.performance_metrics.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    
    if not metrics:
        campaigns = await db.campaigns.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
        
        all_metrics = []
        for campaign in campaigns:
            campaign_metrics = generate_mock_performance(
                campaign["id"],
                campaign["name"],
                campaign["platform"],
                days
            )
            all_metrics.extend(campaign_metrics)
        
        if all_metrics:
            await db.performance_metrics.insert_many(all_metrics)
        
        metrics = all_metrics
    
    # Filter by days
    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    metrics = [m for m in metrics if m["date"] >= cutoff_date]
    
    return [PerformanceMetric(**m) for m in metrics[:1000]]

@api_router.post("/sync")
async def sync_data(current_user: User = Depends(get_current_user)):
    await db.campaigns.delete_many({"user_id": current_user.id})
    await db.performance_metrics.delete_many({})
    
    google_campaigns = generate_mock_campaigns("google_ads", 5)
    facebook_campaigns = generate_mock_campaigns("facebook_ads", 4)
    
    all_campaigns = google_campaigns + facebook_campaigns
    for campaign in all_campaigns:
        campaign["user_id"] = current_user.id
    
    await db.campaigns.insert_many(all_campaigns)
    
    all_metrics = []
    for campaign in all_campaigns:
        campaign_metrics = generate_mock_performance(
            campaign["id"],
            campaign["name"],
            campaign["platform"],
            30
        )
        all_metrics.extend(campaign_metrics)
    
    if all_metrics:
        await db.performance_metrics.insert_many(all_metrics)
    
    # Broadcast sync completion
    await manager.broadcast({
        "type": "sync_complete",
        "data": {
            "campaigns_synced": len(all_campaigns),
            "metrics_synced": len(all_metrics)
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "status": "success",
        "campaigns_synced": len(all_campaigns),
        "metrics_synced": len(all_metrics)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    # Start background task for real-time updates
    asyncio.create_task(broadcast_realtime_updates())
    logging.info("Real-time broadcast task started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
