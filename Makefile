.PHONY: help dev dev-backend dev-frontend test test-backend test-frontend build clean

help:
	@echo "Commandes utiles pour Nexus Dashboard :"
	@echo "  make dev          - Lance le backend et le frontend en parallèle pour le dev local"
	@echo "  make dev-backend  - Lance uniquement le serveur FastAPI (port 8000)"
	@echo "  make dev-frontend - Lance uniquement le serveur Vite React (port 5173)"
	@echo "  make test         - Exécute l'ensemble des tests unitaires et vérifie le build"
	@echo "  make build        - Compile le frontend et vérifie les conteneurs Docker"
	@echo "  make docker-dev   - Lance l'application complète via Docker Compose localement"

dev-backend:
	@echo "Démarrage du backend FastAPI sur http://localhost:8000 ..."
	PYTHONPATH=. python3 -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000

dev-frontend:
	@echo "Démarrage du frontend Vite sur http://localhost:5173 ..."
	cd frontend && npm run dev -- --host 127.0.0.1 --port 5173

test-backend:
	@echo "Exécution des tests backend avec pytest..."
	PYTHONPATH=. pytest backend/tests/ -v

test-frontend:
	@echo "Vérification de la compilation TypeScript et build frontend..."
	cd frontend && npm run build

test: test-backend test-frontend

build:
	cd frontend && npm run build
	docker compose config

docker-dev:
	docker compose up --build

clean:
	rm -rf nexus.db .pytest_cache frontend/dist
	find . -name "__pycache__" -type d -exec rm -rf {} +
