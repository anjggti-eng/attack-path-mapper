.PHONY: help install dev test lint docker-build docker-up docker-down

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

dev: ## Start development environment
	docker-compose up -d
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
	cd frontend && npm start

test: ## Run tests
	cd backend && pytest
	cd frontend && npm test

lint: ## Run linter
	cd backend && ruff check .
	cd frontend && npm run lint

docker-build: ## Build Docker images
	docker-compose build

docker-up: ## Start production environment
	docker-compose -f docker-compose.prod.yml up -d

docker-down: ## Stop all containers
	docker-compose down

migrate: ## Run database migrations
	cd backend && alembic upgrade head

seed: ## Seed database with sample data
	cd backend && python -m app.utils.seed

clean: ## Clean up
	docker-compose down -v
	rm -rf backend/__pycache__ frontend/node_modules
