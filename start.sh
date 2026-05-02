#!/bin/bash
# Start Poker Game (Backend + Frontend)
# Usage: ./start.sh [backend|frontend|both]

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

start_backend() {
  echo "🎰 Starting Poker Backend on port 3001..."
  cd "$ROOT/poker/poker-backend"
  node src/server.js &
  BACKEND_PID=$!
  echo "   Backend PID: $BACKEND_PID"
}

start_frontend() {
  echo "🎨 Starting Poker Frontend dev server..."
  cd "$ROOT/poker/poker-frontend"
  npx vite --host 0.0.0.0 &
  FRONTEND_PID=$!
  echo "   Frontend PID: $FRONTEND_PID"
}

case "${1:-both}" in
  backend)
    start_backend
    wait $BACKEND_PID
    ;;
  frontend)
    start_frontend
    wait $FRONTEND_PID
    ;;
  both)
    start_backend
    sleep 2
    start_frontend
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Backend:  http://localhost:3001"
    echo "  Frontend: http://localhost:5173"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Press Ctrl+C to stop both"
    echo ""
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
    wait
    ;;
esac
