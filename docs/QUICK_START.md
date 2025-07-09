# VitalFlow Quick Start Guide

This guide will help you get the VitalFlow health and wellness platform running locally for development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker & Docker Compose**: For running infrastructure services
- **Go 1.21+**: For the ingestion service
- **Python 3.11+**: For the data simulator
- **Node.js 18+**: For the React frontend
- **Java 17+**: For Spring Boot services (optional for initial setup)
- **Git**: For version control

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Health-and-Wellness
```

### 2. Start Infrastructure Services

Start the core infrastructure services (Kafka, PostgreSQL, Redis, etc.):

```bash
# Start all infrastructure services
docker-compose up -d

# Or start specific services
docker-compose up -d kafka zookeeper postgres redis prometheus grafana jaeger
```

**Access Points:**
- Kafka UI: http://localhost:8080
- Grafana: http://localhost:3000 (admin/admin)
- Jaeger: http://localhost:16686
- Kibana: http://localhost:5601

### 3. Build and Start Services

#### Option A: Using Make (Recommended)

```bash
# Set up development environment
make dev-setup

# Build all services
make build-all

# Start all services
make start-services
```

#### Option B: Manual Start

```bash
# Start Go services
cd services/ingestion && go run main.go &
cd services/api-gateway && go run main.go &

# Start Python services
cd services/data-simulator && python app.py &

# Start React frontend
cd frontend && npm install && npm start &
```

### 4. Access the Application

- **Frontend Dashboard**: http://localhost:3000
- **Ingestion Service**: http://localhost:8080
- **Data Simulator**: http://localhost:8001

### 5. Generate Test Data

Start the data simulator to generate realistic health data:

```bash
# Trigger a single simulation
curl -X POST http://localhost:8001/simulate

# Start scheduled simulation (runs every 30 seconds)
curl -X POST http://localhost:8001/start-scheduled
```

## Service Details

### Infrastructure Services

| Service | Port | Purpose |
|---------|------|---------|
| Kafka | 9092 | Event streaming |
| Zookeeper | 2181 | Kafka coordination |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Caching |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3000 | Dashboards |
| Jaeger | 16686 | Distributed tracing |
| Elasticsearch | 9200 | Log storage |
| Kibana | 5601 | Log visualization |

### Application Services

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| Ingestion Service | 8080 | Go | Health data ingestion |
| Data Simulator | 8001 | Python | Test data generation |
| Frontend | 3000 | React | User dashboard |

## Development Workflow

### 1. Making Changes

```bash
# Edit service code
# The services will auto-reload (Go) or you can restart manually

# For Go services
cd services/ingestion && go run main.go

# For Python services
cd services/data-simulator && python app.py

# For React frontend
cd frontend && npm start
```

### 2. Testing

```bash
# Run all tests
make test-all

# Test specific services
cd services/ingestion && go test ./...
cd services/data-simulator && python -m pytest
cd frontend && npm test
```

### 3. Building Docker Images

```bash
# Build all images
make docker-build

# Build specific service
docker build -t vitalflow/ingestion-service:latest services/ingestion/
```

## Monitoring and Debugging

### 1. View Logs

```bash
# View all container logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f kafka
docker-compose logs -f postgres
```

### 2. Access Monitoring Tools

- **Grafana**: http://localhost:3000 (admin/admin)
  - View system metrics
  - Create custom dashboards
  - Monitor application performance

- **Jaeger**: http://localhost:16686
  - Trace requests across services
  - Debug performance issues
  - View service dependencies

- **Kafka UI**: http://localhost:8080
  - View Kafka topics
  - Monitor message flow
  - Manage consumer groups

### 3. Database Access

```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U vitalflow -d vitalflow

# View tables
\dt

# Query health events
SELECT * FROM health_events LIMIT 10;
```

## API Testing

### 1. Health Event Ingestion

```bash
# Send a health event
curl -X POST http://localhost:8080/health/event \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "event_type": "activity_update",
    "category": "activity",
    "value": {
      "steps": 8500,
      "calories": 450,
      "distance_km": 6.8
    },
    "source": "fitness_tracker",
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

### 2. Batch Event Ingestion

```bash
# Send multiple events
curl -X POST http://localhost:8080/health/events/batch \
  -H "Content-Type: application/json" \
  -d '[
    {
      "user_id": "user123",
      "event_type": "heart_rate_measurement",
      "category": "heart_rate",
      "value": {"bpm": 72},
      "source": "smart_watch"
    },
    {
      "user_id": "user123",
      "event_type": "sleep_session",
      "category": "sleep",
      "value": {"duration_hours": 7.5},
      "source": "sleep_tracker"
    }
  ]'
```

### 3. Data Simulator Control

```bash
# Trigger simulation
curl -X POST http://localhost:8001/simulate

# Start scheduled simulation
curl -X POST http://localhost:8001/start-scheduled

# Stop scheduled simulation
curl -X POST http://localhost:8001/stop-scheduled
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using a port
   lsof -i :8080
   
   # Kill process using port
   kill -9 <PID>
   ```

2. **Docker Issues**
   ```bash
   # Clean up Docker resources
   docker system prune -a
   
   # Restart Docker services
   docker-compose down
   docker-compose up -d
   ```

3. **Database Connection Issues**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Restart PostgreSQL
   docker-compose restart postgres
   ```

4. **Kafka Issues**
   ```bash
   # Check Kafka topics
   docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092
   
   # Restart Kafka
   docker-compose restart kafka
   ```

### Performance Tuning

1. **Increase Docker Resources**
   - Allocate more CPU and memory to Docker
   - Increase Docker disk space

2. **Optimize Database**
   ```sql
   -- Add indexes for better performance
   CREATE INDEX idx_health_events_user_timestamp ON health_events(user_id, timestamp);
   ```

3. **Monitor Resource Usage**
   ```bash
   # Check Docker resource usage
   docker stats
   
   # Check system resources
   htop
   ```

## Next Steps

1. **Explore the Codebase**
   - Review the architecture documentation
   - Understand the service interactions
   - Examine the data models

2. **Add New Features**
   - Implement additional health metrics
   - Create new visualization components
   - Add ML-powered insights

3. **Deploy to Cloud**
   - Set up Azure Kubernetes Service
   - Configure CI/CD pipelines
   - Deploy to production

4. **Contribute**
   - Fork the repository
   - Create feature branches
   - Submit pull requests

## Support

- **Documentation**: Check the `/docs` directory
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Architecture**: Review `docs/ARCHITECTURE.md`

Happy coding! 🚀 