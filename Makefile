.PHONY: help dev-setup start-infrastructure stop-infrastructure start-services stop-services build-all test-all clean docker-build docker-push azure-deploy

# Default target
help:
	@echo "VitalFlow Health & Wellness Platform"
	@echo "=================================="
	@echo ""
	@echo "Available commands:"
	@echo "  dev-setup          - Set up development environment"
	@echo "  start-infrastructure - Start infrastructure services (Kafka, DB, Redis, etc.)"
	@echo "  stop-infrastructure  - Stop infrastructure services"
	@echo "  start-services     - Start all microservices"
	@echo "  stop-services      - Stop all microservices"
	@echo "  build-all          - Build all services"
	@echo "  test-all           - Run all tests"
	@echo "  clean              - Clean build artifacts"
	@echo "  docker-build       - Build all Docker images"
	@echo "  docker-push        - Push Docker images to registry"
	@echo "  azure-deploy       - Deploy to Azure"
	@echo ""

# Development setup
dev-setup:
	@echo "Setting up development environment..."
	@mkdir -p services/ingestion
	@mkdir -p services/processing
	@mkdir -p services/user-profile
	@mkdir -p services/analytics
	@mkdir -p services/notification
	@mkdir -p services/api-gateway
	@mkdir -p services/chatbot
	@mkdir -p frontend
	@mkdir -p docs
	@mkdir -p scripts
	@echo "Development environment setup complete!"

# Infrastructure management
start-infrastructure:
	@echo "Starting infrastructure services..."
	docker-compose up -d zookeeper kafka postgres redis prometheus grafana jaeger elasticsearch kibana kafka-ui
	@echo "Infrastructure services started!"
	@echo "Kafka UI: http://localhost:8080"
	@echo "Grafana: http://localhost:3000 (admin/admin)"
	@echo "Jaeger: http://localhost:16686"
	@echo "Kibana: http://localhost:5601"

stop-infrastructure:
	@echo "Stopping infrastructure services..."
	docker-compose down
	@echo "Infrastructure services stopped!"

# Service management
start-services:
	@echo "Starting microservices..."
	@echo "Note: Services need to be built first with 'make build-all'"
	@echo "Starting Go services..."
	@cd services/ingestion && go run main.go &
	@cd services/api-gateway && go run main.go &
	@echo "Starting Java services..."
	@cd services/user-profile && ./mvnw spring-boot:run &
	@cd services/processing && ./mvnw spring-boot:run &
	@cd services/notification && ./mvnw spring-boot:run &
	@echo "Starting Python services..."
	@cd services/analytics && python app.py &
	@cd services/chatbot && python app.py &
	@echo "Starting frontend..."
	@cd frontend && npm start &
	@echo "All services started!"

stop-services:
	@echo "Stopping microservices..."
	@pkill -f "go run main.go" || true
	@pkill -f "spring-boot:run" || true
	@pkill -f "python app.py" || true
	@pkill -f "npm start" || true
	@echo "All services stopped!"

# Building
build-all:
	@echo "Building all services..."
	@echo "Building Go services..."
	@cd services/ingestion && go build -o bin/ingestion-service .
	@cd services/api-gateway && go build -o bin/api-gateway .
	@echo "Building Java services..."
	@cd services/user-profile && ./mvnw clean compile
	@cd services/processing && ./mvnw clean compile
	@cd services/notification && ./mvnw clean compile
	@echo "Building Python services..."
	@cd services/analytics && pip install -r requirements.txt
	@cd services/chatbot && pip install -r requirements.txt
	@echo "Building frontend..."
	@cd frontend && npm install && npm run build
	@echo "All services built!"

# Testing
test-all:
	@echo "Running all tests..."
	@echo "Testing Go services..."
	@cd services/ingestion && go test ./...
	@cd services/api-gateway && go test ./...
	@echo "Testing Java services..."
	@cd services/user-profile && ./mvnw test
	@cd services/processing && ./mvnw test
	@cd services/notification && ./mvnw test
	@echo "Testing Python services..."
	@cd services/analytics && python -m pytest
	@cd services/chatbot && python -m pytest
	@echo "Testing frontend..."
	@cd frontend && npm test -- --watchAll=false
	@echo "All tests completed!"

# Docker operations
docker-build:
	@echo "Building Docker images..."
	docker build -t vitalflow/ingestion-service:latest services/ingestion/
	docker build -t vitalflow/api-gateway:latest services/api-gateway/
	docker build -t vitalflow/user-profile-service:latest services/user-profile/
	docker build -t vitalflow/processing-service:latest services/processing/
	docker build -t vitalflow/notification-service:latest services/notification/
	docker build -t vitalflow/analytics-service:latest services/analytics/
	docker build -t vitalflow/chatbot-service:latest services/chatbot/
	docker build -t vitalflow/frontend:latest frontend/
	@echo "All Docker images built!"

docker-push:
	@echo "Pushing Docker images to registry..."
	docker push vitalflow/ingestion-service:latest
	docker push vitalflow/api-gateway:latest
	docker push vitalflow/user-profile-service:latest
	docker push vitalflow/processing-service:latest
	docker push vitalflow/notification-service:latest
	docker push vitalflow/analytics-service:latest
	docker push vitalflow/chatbot-service:latest
	docker push vitalflow/frontend:latest
	@echo "All Docker images pushed!"

# Azure deployment
azure-deploy:
	@echo "Deploying to Azure..."
	@echo "Note: Azure CLI and kubectl must be configured"
	@cd infrastructure/k8s && kubectl apply -f namespace.yml
	@cd infrastructure/k8s && kubectl apply -f kafka/
	@cd infrastructure/k8s && kubectl apply -f services/
	@cd infrastructure/k8s && kubectl apply -f monitoring/
	@echo "Deployment to Azure completed!"

# Cleanup
clean:
	@echo "Cleaning build artifacts..."
	@find . -name "bin" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name "target" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
	@echo "Cleanup completed!"

# Development shortcuts
dev: dev-setup start-infrastructure
	@echo "Development environment ready!"
	@echo "Next steps:"
	@echo "1. make build-all"
	@echo "2. make start-services"
	@echo "3. Access the application at http://localhost:3000"

# Quick start for development
quick-start: dev-setup start-infrastructure build-all start-services
	@echo "VitalFlow platform is running!"
	@echo "Access points:"
	@echo "- Frontend: http://localhost:3000"
	@echo "- API Gateway: http://localhost:8080"
	@echo "- Kafka UI: http://localhost:8080"
	@echo "- Grafana: http://localhost:3000"
	@echo "- Jaeger: http://localhost:16686" 