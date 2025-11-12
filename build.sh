#!/bin/bash
set -Eeuo pipefail

# --- Pre-execution Setup ---

# Define colors and icons for better readability
BLUE='\x1b[38;2;30;144;255m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
TICK="${GREEN}✔${NC}"
CROSS="${RED}✖${NC}"
INFO="${BLUE}ℹ${NC}"
WARN="${YELLOW}⚠${NC}"
ARROW="${BLUE}➜${NC}"
HR="$(printf "%$(tput cols)s" "" | tr ' ' '-')"

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
echo -e "${BLUE}${HR}${NC}"
echo -e "${ARROW} ${BLUE}Starting AK2 Dashboard build${NC}"
echo -e "${BLUE}${HR}${NC}"

if [ ! -f "$FRONTEND_TARGET" ] || [ "$NEWEST_SOURCE_FILE" -nt "$FRONTEND_TARGET" ]; then
  echo -e "${INFO} Changes detected in frontend. Building..."
  cd frontend
  npm install
  
  echo -e "${INFO} ${BLUE}Running smoke test for dev server...${NC}"
  npm run check
  
  echo -e "${INFO} ${BLUE}Running frontend build...${NC}"
  npm run build
  
  rsync -av --delete \
    --exclude 'files' \
    --exclude 'api' \
    --exclude 'deprecated' \
    build/ \
    ../webserver/opt/webfs/
  cd ..
  
  # Report frontend size
  FRONTEND_SIZE=$(du -sh frontend/build)
  echo -e "${TICK} Frontend build complete. Size: ${GREEN}${FRONTEND_SIZE}${NC}"
else
  echo -e "${TICK} ${GREEN}Frontend is up-to-date. Skipping build.${NC}"
fi

echo -e "${INFO} ${BLUE}Building backend...${NC}"
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

# Report final package size
ZIP_SIZE=$(du -h webserver/webserver.zip | awk '{print $1}')
echo -e "${GREEN}${HR}${NC}"
echo -e "${GREEN}${TICK} ${GREEN}SUCCESS! The package is ready in: webserver/webserver.zip (${ZIP_SIZE})${NC}"
echo -e "${GREEN}${HR}${NC}"
