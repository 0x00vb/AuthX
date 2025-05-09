#!/bin/bash

# Define the directories explicitly
AUTH_DIR="/home/null/projects/AuthX"
REACT_DIR="/home/null/projects/AuthX/test-react-app"

# Kill any existing processes
pkill -f "node dev-server.js" || true

# Kill SMTP server processes if they exist
for PORT in 2525 8025; do
  PID=$(lsof -i:$PORT -t)
  if [ ! -z "$PID" ]; then
    kill -9 $PID || true
    echo "Killed process using port $PORT"
  fi
done

# Start the auth server in background
echo "Starting AuthX server at $AUTH_DIR"
cd "$AUTH_DIR"
npm run start:dev &
AUTH_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 3

# Now start the React app on port 3001
echo "Starting React app at $REACT_DIR"
cd "$REACT_DIR"
PORT=3001 npm start

# Clean up when React app exits
echo "Cleaning up..."
kill $AUTH_PID || true