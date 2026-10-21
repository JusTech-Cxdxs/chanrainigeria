#!/usr/bin/env bash
# Builds the customer release: a prebuilt Docker image (compiled code only, no source) plus the
# install folder. Run on a machine with Docker:  npm run release  (or: bash scripts/release.sh 1.2.0)
# Output: release/chanrai-web-<version>/  and  release/chanrai-web-<version>.zip
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="${1:-$(node -p "require('./package.json').version")}"
IMAGE="chanrai-web:${VERSION}"
OUT="release/chanrai-web-${VERSION}"

echo "Building ${IMAGE} for linux/amd64..."
docker build --platform linux/amd64 --target runner --build-arg VERSION="${VERSION}" -t "${IMAGE}" -t chanrai-web:latest .

# Safety check: the image must not contain source files.
if docker run --rm --entrypoint sh "${IMAGE}" -c 'ls src scripts/seed.ts 2>/dev/null | head -1' | grep -q .; then
  echo "Source files found in the image. Stopping." >&2
  exit 1
fi

rm -rf "${OUT}" && mkdir -p "${OUT}/backups"
echo "Saving the image..."
docker save "${IMAGE}" chanrai-web:latest | gzip -9 > "${OUT}/chanrai-web-${VERSION}.tar.gz"
cp deploy/docker-compose.yml deploy/.env.example deploy/INSTALL.md LICENSE "${OUT}/"
sed -i.bak "s/^WEB_IMAGE=.*/WEB_IMAGE=chanrai-web:${VERSION}/" "${OUT}/.env.example" && rm -f "${OUT}/.env.example.bak"
(cd "${OUT}" && sha256sum "chanrai-web-${VERSION}.tar.gz" > SHA256SUMS)
(cd release && rm -f "chanrai-web-${VERSION}.zip" && zip -qr "chanrai-web-${VERSION}.zip" "chanrai-web-${VERSION}")

echo "Done: release/chanrai-web-${VERSION}.zip"
echo "Give the customer that zip file. It contains the image, INSTALL.md, the compose file and the licence."
