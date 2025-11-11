#!/bin/bash
set -Eeuo pipefail

# --- Frontend Build Optimization ---

FRONTEND_DIR="frontend"
# Define a target file that is created at the end of a successful frontend build.
FRONTEND_TARGET="webserver/opt/webfs/_app/version.json"

# Find the newest file in the frontend source directory.
# Excludes build artifacts and node_modules.
NEWEST_SOURCE_FILE=$(find "$FRONTEND_DIR" -type f \
  -not -path "$FRONTEND_DIR/node_modules/*" \
  -not -path "$FRONTEND_DIR/build/*" \
  -not -path "$FRONTEND_DIR/.svelte-kit/*" \
  -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

# --- Build Process ---

if [ ! -f "$FRONTEND_TARGET" ] || [ "$NEWEST_SOURCE_FILE" -nt "$FRONTEND_TARGET" ]; then
    echo "Changes detected in frontend. Building..."
    cd frontend
    npm install
    
    echo "Running smoke test for dev server..."
    npm run check
    
    npm run build
    
    rsync -av --delete \
      --exclude 'files' \
      --exclude 'api' \
      --exclude 'deprecated' \
      build/ ../webserver/opt/webfs/
    cd ..
else
    echo "⏩ Frontend is up-to-date. Skipping build."
fi

echo "Building backend..."
cd src
make
../arm-linux-musleabi-cross/arm-linux-musleabi/bin/strip webfsd
if [ ! -d "../webserver/opt/bin" ]; then
    mkdir -p ../webserver/opt/bin
fi
cp -f webfsd ../webserver/opt/bin/webfsd
cd ../webserver
rm -f webserver.zip
zip -r --symlinks webserver.zip etc opt
cd ..

echo "SUCCESS! The package is ready in: webserver/webserver.zip"
