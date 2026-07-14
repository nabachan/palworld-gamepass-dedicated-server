#!/usr/bin/env bash
# Capture accurate UI screenshots (Electron capturePage) + demo video.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
OUT="$REPO/docs/screenshots"
SIM="$ROOT/simulator-data-capture"
USER_DATA="$ROOT/.capture-userdata"
DISPLAY_NUM=99
export DISPLAY=":$DISPLAY_NUM"

mkdir -p "$OUT"
rm -rf "$SIM" "$USER_DATA" "$OUT"/.capture-done
mkdir -p "$SIM" "$USER_DATA"

pkill -f "Xvfb :$DISPLAY_NUM" 2>/dev/null || true
sleep 0.2
Xvfb "$DISPLAY" -screen 0 1440x900x24 -ac -nolisten tcp >/tmp/xvfb-capture.log 2>&1 &
XVFB_PID=$!
for i in $(seq 1 25); do
  xdpyinfo -display "$DISPLAY" >/dev/null 2>&1 && break
  sleep 0.2
done

cleanup() {
  [[ -n "${APP_PID:-}" ]] && kill "$APP_PID" 2>/dev/null || true
  [[ -n "${MOCK_PID:-}" ]] && kill "$MOCK_PID" 2>/dev/null || true
  [[ -n "${REC_PID:-}" ]] && kill -INT "$REC_PID" 2>/dev/null || true
  [[ -n "${XVFB_PID:-}" ]] && kill "$XVFB_PID" 2>/dev/null || true
}
trap cleanup EXIT

cd "$ROOT"
npm run build >/tmp/capture-build.log 2>&1

ELECTRON_RUN_AS_NODE=1 ./node_modules/electron/dist/electron \
  resources/mock-palworld-server.js --data "$SIM" --rcon-port 25575 \
  >/tmp/mock-capture.log 2>&1 &
MOCK_PID=$!
export PALWORLD_SIM_RCON_PASSWORD=admin
sleep 1

SEED_JSON=$(node -e "console.log(JSON.stringify({
  serverPath: process.argv[1],
  rconHost: '127.0.0.1',
  rconPort: 25575,
  rconPassword: 'admin',
  gamePort: 8211,
  autoBackupEnabled: true,
  autoBackupIntervalMinutes: 60,
  autoBackupKeepCount: 5,
  launchArgs: '-useperfthreads -publiclobby',
  useSimulator: true,
  language: 'fr'
}))" "$SIM")

# Record the virtual display while auto-capture navigates
ffmpeg -y -f x11grab -video_size 1440x900 -framerate 12 -i "${DISPLAY}.0" \
  -c:v libx264 -pix_fmt yuv420p -preset veryfast \
  "$OUT/demo-ui.mp4" >/tmp/ffmpeg-capture.log 2>&1 &
REC_PID=$!

PSM_AUTO_CAPTURE=1 \
PSM_CAPTURE_DIR="$OUT" \
PSM_SEED_JSON="$SEED_JSON" \
./node_modules/electron/dist/electron . \
  --user-data-dir="$USER_DATA" \
  --no-sandbox \
  --disable-gpu \
  --disable-dev-shm-usage \
  >/tmp/electron-capture.log 2>&1 &
APP_PID=$!

# Wait for capture completion (max ~60s)
for i in $(seq 1 60); do
  if [[ -f "$OUT/.capture-done" ]]; then
    break
  fi
  if ! kill -0 "$APP_PID" 2>/dev/null; then
    break
  fi
  sleep 1
done

sleep 1
kill -INT "$REC_PID" 2>/dev/null || true
wait "$REC_PID" 2>/dev/null || true
REC_PID=""
APP_PID=""

if [[ ! -f "$OUT/01-overview.png" ]]; then
  echo "Capture failed — electron log:" >&2
  cat /tmp/electron-capture.log >&2 || true
  exit 1
fi

# Slideshow fallback if live video is weak
if [[ ! -s "$OUT/demo-ui.mp4" ]] || [[ $(stat -c%s "$OUT/demo-ui.mp4") -lt 100000 ]]; then
  ffmpeg -y -framerate 0.4 -pattern_type glob -i "$OUT/0*.png" \
    -c:v libx264 -pix_fmt yuv420p \
    -vf "scale=1360:900:force_original_aspect_ratio=decrease,pad=1360:900:(ow-iw)/2:(oh-ih)/2" \
    -r 30 "$OUT/demo-ui.mp4" >/tmp/ffmpeg-slideshow.log 2>&1
fi

rm -f "$OUT/.capture-done"
ls -lh "$OUT"
echo "CAPTURE_OK"
