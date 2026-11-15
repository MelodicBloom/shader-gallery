#!/bin/bash
# Resumable offline render of the full 40 s loop + encode + seam check. Run detached:
#   setsid nohup nice -n 5 tools/render_loop.sh 1920 1080 60 3 > render.log 2>&1 < /dev/null &
# args: W H FPS AA [BITRATE e.g. 9M | crf:16]
set -e
cd "$(dirname "$0")/.."
W=${1:-1280}; H=${2:-720}; FPS=${3:-30}; AA=${4:-2}; RATE=${5:-9M}
OUT=media/crystal_tunnel_v2_loop_${H}p${FPS}.mp4; FR=work/frames_${H}p${FPS}
python3 tools/render.py frames --w $W --h $H --aa $AA --fps $FPS --out $FR
if [[ $RATE == crf:* ]]; then Q="-crf ${RATE#crf:}"; else Q="-b:v $RATE -maxrate $RATE -bufsize $RATE"; fi
ffmpeg -v error -y -framerate $FPS -i $FR/f%05d.png -c:v libx264 -preset slow $Q -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart $OUT
python3 tools/seam_check.py $OUT ${OUT%.mp4}_seam_check.mp4 | tee ${OUT%.mp4}_seam.json
