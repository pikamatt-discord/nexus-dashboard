#!/usr/bin/env bash
set -e

echo "===================================================="
echo "🚀 Démarrage de Nexus Dashboard (Mode Dev Local)"
echo "===================================================="

# Create .env if missing
if [ ! -f ".env" ]; then
    echo "📝 Création automatique du fichier .env pour le dev local..."
    cp .env.example .env
fi

# Set DEV_MODE=true for local execution
export DEV_MODE=true
export ENFORCE_LAN_ONLY=false

# Determine python command (python3 or python)
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo "❌ Erreur: Python 3 est requis mais non trouvé."
    exit 1
fi

# Determine node command
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Erreur: Node.js est requis mais non trouvé."
    exit 1
fi

# Check Python backend dependencies (e.g. uvicorn)
if ! $PYTHON_CMD -c "import uvicorn, fastapi" >/dev/null 2>&1; then
    echo "📦 Installation des dépendances Python backend..."
    $PYTHON_CMD -m pip install -r backend/requirements.txt
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installation des dépendances npm frontend..."
    cd frontend && npm install && cd ..
fi

echo "🟢 Lancement du Backend FastAPI (port 8000)..."
echo "👉 API Swagger Docs: http://localhost:8000/api/v1/docs"
PYTHONPATH=. $PYTHON_CMD -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

echo "🟣 Lancement du Frontend React Vite (port 5173)..."
cd frontend && npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "🛑 Arrêt des serveurs de dev locaux..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup INT TERM

echo ""
echo "✨ Console Nexus active !"
echo "👉 Interface Web: http://localhost:5173"
echo "👉 Identifiants par défaut: admin / admin123"
echo "Mode Développement Local : Les conteneurs et stacks sont simulés pour un test fluide sans Portainer."
echo "Appuyez sur CTRL+C pour arrêter."

wait
