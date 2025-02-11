#!/bin/bash

# Kill existing processes
pkill -f "node.*5173" || true
pkill -f "node.*3000" || true
pkill -f "ngrok" || true

# Cleanup function
cleanup() {
  echo "Cleaning up processes..."
  pkill -f "node.*5173" || true
  pkill -f "node.*3000" || true
  pkill -f "ngrok" || true
  exit 0
}

# Set up cleanup on script exit
trap cleanup EXIT INT TERM

# Start backend and frontend
echo "🚀 Starting services..."
npm run dev &
DEV_PID=$!

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 5

# Function to extract ngrok URL with better error handling
get_ngrok_url() {
  local max_attempts=10
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    echo "Attempting to get ngrok URL (attempt $attempt/$max_attempts)..."
    local url=$(curl -s http://localhost:4040/api/tunnels | grep -o "https://[^\"]*\.ngrok-free.app" || true)
    
    if [ ! -z "$url" ]; then
      echo "$url"
      return 0
    fi
    
    sleep 2
    attempt=$((attempt + 1))
  done
  
  return 1
}

# Start ngrok
echo "🔗 Starting ngrok..."
echo "⚠️  When ngrok starts:"
echo "1. Update Twitter Developer Portal URLs"
echo "2. Your .env.development will be updated automatically"

# Start ngrok in background
ngrok http 5173 > /dev/null 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start and get URL
sleep 5
NGROK_URL=$(get_ngrok_url)

if [ ! -z "$NGROK_URL" ]; then
  echo "✅ ngrok URL: $NGROK_URL"
  npm run update:ngrok "$NGROK_URL"
else
  echo "❌ Failed to get ngrok URL after multiple attempts"
  echo "Please check if ngrok is running properly"
  cleanup
  exit 1
fi

# Wait for all processes
wait $DEV_PID 