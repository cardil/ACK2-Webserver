#!/bin/bash
set -Eeuo pipefail

echo "Building frontend..."
cd frontend
npm install

echo "Running smoke test for dev server..."
npm run check

npm run build
rsync -av --delete --exclude 'files' --exclude 'api' build/ ../webserver/opt/webfs/
cd ..

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
