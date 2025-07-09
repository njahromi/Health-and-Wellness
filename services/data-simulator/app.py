#!/usr/bin/env python3
"""
VitalFlow Data Simulator Service

Generates realistic health data and sends it to the ingestion service.
Simulates various health devices and apps like fitness trackers, smart scales, etc.
"""

import asyncio
import json
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging
from dataclasses import dataclass, asdict

import requests
import schedule
from faker import Faker
from prometheus_client import Counter, Histogram, start_http_server
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from pydantic import BaseModel
import uvicorn
from fastapi import FastAPI, HTTPException

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Faker for generating realistic data
fake = Faker()

# Prometheus metrics
events_sent = Counter('simulator_events_sent_total', 'Total events sent', ['event_type', 'source'])
events_failed = Counter('simulator_events_failed_total', 'Total events failed', ['error_type'])
request_duration = Histogram('simulator_request_duration_seconds', 'Request duration', ['endpoint'])

# Health event model
class HealthEvent(BaseModel):
    user_id: str
    event_type: str
    category: str
    value: Dict[str, Any]
    timestamp: datetime
    source: str
    device_id: str = None

@dataclass
class SimulatorConfig:
    ingestion_service_url: str = "http://localhost:8080"
    simulation_interval: int = 30  # seconds
    num_users: int = 10
    enable_activity: bool = True
    enable_heart_rate: bool = True
    enable_sleep: bool = True
    enable_nutrition: bool = True
    enable_weight: bool = True
    enable_mood: bool = True
    enable_hydration: bool = True
    enable_meditation: bool = True

class HealthDataSimulator:
    def __init__(self, config: SimulatorConfig):
        self.config = config
        self.users = self._generate_users()
        self.tracer = trace.get_tracer(__name__)
        
        # Initialize Jaeger tracer
        self._setup_tracing()
        
        logger.info(f"Initialized simulator with {len(self.users)} users")
    
    def _setup_tracing(self):
        """Setup OpenTelemetry tracing with Jaeger"""
        resource = Resource.create({"service.name": "data-simulator"})
        trace_provider = TracerProvider(resource=resource)
        
        jaeger_exporter = JaegerExporter(
            agent_host_name="localhost",
            agent_port=6831,
        )
        
        span_processor = BatchSpanProcessor(jaeger_exporter)
        trace_provider.add_span_processor(span_processor)
        
        trace.set_tracer_provider(trace_provider)
    
    def _generate_users(self) -> List[str]:
        """Generate fake user IDs"""
        return [fake.uuid4() for _ in range(self.config.num_users)]
    
    def _generate_activity_data(self, user_id: str) -> HealthEvent:
        """Generate realistic activity data"""
        steps = random.randint(500, 15000)
        distance = steps * 0.0008  # Approximate km
        calories = steps * 0.04  # Approximate calories
        
        return HealthEvent(
            user_id=user_id,
            event_type="activity_update",
            category="activity",
            value={
                "steps": steps,
                "distance_km": round(distance, 2),
                "calories_burned": round(calories, 2),
                "active_minutes": random.randint(10, 120),
                "floors_climbed": random.randint(0, 20),
                "activity_type": random.choice(["walking", "running", "cycling", "swimming"])
            },
            timestamp=datetime.now(),
            source="fitness_tracker",
            device_id=f"tracker_{user_id[:8]}"
        )
    
    def _generate_heart_rate_data(self, user_id: str) -> HealthEvent:
        """Generate realistic heart rate data"""
        # Simulate different heart rates based on time of day
        hour = datetime.now().hour
        if 6 <= hour <= 8:  # Morning
            base_rate = random.randint(60, 80)
        elif 12 <= hour <= 14:  # Afternoon
            base_rate = random.randint(70, 90)
        elif 18 <= hour <= 20:  # Evening
            base_rate = random.randint(65, 85)
        else:  # Night
            base_rate = random.randint(50, 70)
        
        return HealthEvent(
            user_id=user_id,
            event_type="heart_rate_measurement",
            category="heart_rate",
            value={
                "bpm": base_rate + random.randint(-10, 10),
                "resting_hr": random.randint(50, 75),
                "max_hr": random.randint(180, 200),
                "hr_variability": random.randint(20, 60)
            },
            timestamp=datetime.now(),
            source="smart_watch",
            device_id=f"watch_{user_id[:8]}"
        )
    
    def _generate_sleep_data(self, user_id: str) -> HealthEvent:
        """Generate realistic sleep data"""
        sleep_duration = random.uniform(6.0, 9.0)
        deep_sleep = sleep_duration * random.uniform(0.15, 0.25)
        rem_sleep = sleep_duration * random.uniform(0.20, 0.30)
        light_sleep = sleep_duration - deep_sleep - rem_sleep
        
        return HealthEvent(
            user_id=user_id,
            event_type="sleep_session",
            category="sleep",
            value={
                "duration_hours": round(sleep_duration, 2),
                "deep_sleep_hours": round(deep_sleep, 2),
                "rem_sleep_hours": round(rem_sleep, 2),
                "light_sleep_hours": round(light_sleep, 2),
                "sleep_score": random.randint(60, 95),
                "sleep_efficiency": random.randint(70, 98),
                "bedtime": (datetime.now() - timedelta(hours=sleep_duration)).isoformat(),
                "wake_time": datetime.now().isoformat()
            },
            timestamp=datetime.now(),
            source="sleep_tracker",
            device_id=f"sleep_{user_id[:8]}"
        )
    
    def _generate_nutrition_data(self, user_id: str) -> HealthEvent:
        """Generate realistic nutrition data"""
        meal_types = ["breakfast", "lunch", "dinner", "snack"]
        meal_type = random.choice(meal_types)
        
        # Different calorie ranges for different meals
        calorie_ranges = {
            "breakfast": (300, 600),
            "lunch": (400, 800),
            "dinner": (500, 900),
            "snack": (100, 300)
        }
        
        calories = random.randint(*calorie_ranges[meal_type])
        
        return HealthEvent(
            user_id=user_id,
            event_type="nutrition_log",
            category="nutrition",
            value={
                "calories": calories,
                "protein_g": round(calories * random.uniform(0.15, 0.25) / 4, 1),
                "carbs_g": round(calories * random.uniform(0.40, 0.60) / 4, 1),
                "fat_g": round(calories * random.uniform(0.20, 0.35) / 9, 1),
                "fiber_g": random.randint(5, 25),
                "sugar_g": random.randint(5, 50),
                "sodium_mg": random.randint(200, 1500),
                "meal_type": meal_type,
                "food_items": random.randint(1, 5)
            },
            timestamp=datetime.now(),
            source="nutrition_app",
            device_id=f"app_{user_id[:8]}"
        )
    
    def _generate_weight_data(self, user_id: str) -> HealthEvent:
        """Generate realistic weight data"""
        # Simulate gradual weight changes
        base_weight = 70.0  # kg
        weight_change = random.uniform(-0.5, 0.3)  # kg per day
        
        return HealthEvent(
            user_id=user_id,
            event_type="weight_measurement",
            category="weight",
            value={
                "weight_kg": round(base_weight + weight_change, 1),
                "body_fat_percent": round(random.uniform(10.0, 25.0), 1),
                "muscle_mass_kg": round(random.uniform(25.0, 45.0), 1),
                "bmi": round(random.uniform(18.5, 30.0), 1),
                "body_water_percent": round(random.uniform(45.0, 65.0), 1)
            },
            timestamp=datetime.now(),
            source="smart_scale",
            device_id=f"scale_{user_id[:8]}"
        )
    
    def _generate_mood_data(self, user_id: str) -> HealthEvent:
        """Generate realistic mood data"""
        moods = ["excellent", "good", "neutral", "poor", "terrible"]
        mood = random.choice(moods)
        
        return HealthEvent(
            user_id=user_id,
            event_type="mood_log",
            category="mood",
            value={
                "mood_score": random.randint(1, 10),
                "mood_label": mood,
                "energy_level": random.randint(1, 10),
                "stress_level": random.randint(1, 10),
                "notes": fake.sentence() if random.random() < 0.3 else None
            },
            timestamp=datetime.now(),
            source="mood_app",
            device_id=f"app_{user_id[:8]}"
        )
    
    def _generate_hydration_data(self, user_id: str) -> HealthEvent:
        """Generate realistic hydration data"""
        water_intake = random.randint(500, 3000)  # ml
        
        return HealthEvent(
            user_id=user_id,
            event_type="hydration_log",
            category="hydration",
            value={
                "water_intake_ml": water_intake,
                "daily_goal_ml": 2500,
                "goal_percentage": round((water_intake / 2500) * 100, 1),
                "beverage_type": random.choice(["water", "tea", "coffee", "sports_drink"])
            },
            timestamp=datetime.now(),
            source="hydration_app",
            device_id=f"app_{user_id[:8]}"
        )
    
    def _generate_meditation_data(self, user_id: str) -> HealthEvent:
        """Generate realistic meditation data"""
        duration = random.randint(5, 60)  # minutes
        
        return HealthEvent(
            user_id=user_id,
            event_type="meditation_session",
            category="meditation",
            value={
                "duration_minutes": duration,
                "meditation_type": random.choice(["mindfulness", "transcendental", "loving_kindness", "body_scan"]),
                "focus_score": random.randint(1, 10),
                "calmness_score": random.randint(1, 10),
                "session_quality": random.randint(1, 10)
            },
            timestamp=datetime.now(),
            source="meditation_app",
            device_id=f"app_{user_id[:8]}"
        )
    
    async def _send_event(self, event: HealthEvent) -> bool:
        """Send health event to ingestion service"""
        with self.tracer.start_as_current_span("send_health_event") as span:
            span.set_attribute("event.type", event.event_type)
            span.set_attribute("event.category", event.category)
            span.set_attribute("user.id", event.user_id)
            
            start_time = time.time()
            
            try:
                response = requests.post(
                    f"{self.config.ingestion_service_url}/health/event",
                    json=event.dict(),
                    timeout=10
                )
                
                duration = time.time() - start_time
                request_duration.labels("health_event").observe(duration)
                
                if response.status_code == 200:
                    events_sent.labels(event.event_type, event.source).inc()
                    logger.info(f"Sent {event.event_type} event for user {event.user_id}")
                    return True
                else:
                    events_failed.labels("http_error").inc()
                    logger.error(f"Failed to send event: {response.status_code} - {response.text}")
                    return False
                    
            except Exception as e:
                events_failed.labels("network_error").inc()
                logger.error(f"Error sending event: {e}")
                return False
    
    async def simulate_health_data(self):
        """Simulate health data for all users"""
        logger.info("Starting health data simulation...")
        
        events = []
        
        for user_id in self.users:
            # Generate different types of health data based on configuration
            if self.config.enable_activity and random.random() < 0.7:
                events.append(self._generate_activity_data(user_id))
            
            if self.config.enable_heart_rate and random.random() < 0.5:
                events.append(self._generate_heart_rate_data(user_id))
            
            if self.config.enable_sleep and random.random() < 0.3:
                events.append(self._generate_sleep_data(user_id))
            
            if self.config.enable_nutrition and random.random() < 0.8:
                events.append(self._generate_nutrition_data(user_id))
            
            if self.config.enable_weight and random.random() < 0.2:
                events.append(self._generate_weight_data(user_id))
            
            if self.config.enable_mood and random.random() < 0.4:
                events.append(self._generate_mood_data(user_id))
            
            if self.config.enable_hydration and random.random() < 0.6:
                events.append(self._generate_hydration_data(user_id))
            
            if self.config.enable_meditation and random.random() < 0.3:
                events.append(self._generate_meditation_data(user_id))
        
        # Send events in parallel
        tasks = [self._send_event(event) for event in events]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        successful = sum(1 for result in results if result is True)
        logger.info(f"Simulation complete: {successful}/{len(events)} events sent successfully")

# FastAPI app for controlling the simulator
app = FastAPI(title="VitalFlow Data Simulator", version="1.0.0")

# Global simulator instance
simulator = None
simulation_task = None

@app.on_event("startup")
async def startup_event():
    global simulator
    config = SimulatorConfig()
    simulator = HealthDataSimulator(config)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "data-simulator"}

@app.post("/simulate")
async def trigger_simulation():
    """Manually trigger a simulation run"""
    if simulator:
        await simulator.simulate_health_data()
        return {"message": "Simulation completed"}
    else:
        raise HTTPException(status_code=500, detail="Simulator not initialized")

@app.post("/start-scheduled")
async def start_scheduled_simulation():
    """Start scheduled simulation"""
    global simulation_task
    
    def run_simulation():
        asyncio.create_task(simulator.simulate_health_data())
    
    schedule.every(simulator.config.simulation_interval).seconds.do(run_simulation)
    
    async def run_scheduler():
        while True:
            schedule.run_pending()
            await asyncio.sleep(1)
    
    simulation_task = asyncio.create_task(run_scheduler())
    return {"message": "Scheduled simulation started"}

@app.post("/stop-scheduled")
async def stop_scheduled_simulation():
    """Stop scheduled simulation"""
    global simulation_task
    if simulation_task:
        simulation_task.cancel()
        simulation_task = None
    return {"message": "Scheduled simulation stopped"}

if __name__ == "__main__":
    # Start Prometheus metrics server
    start_http_server(8000)
    
    # Start FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=8001) 