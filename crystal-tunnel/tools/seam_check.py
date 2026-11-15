#!/usr/bin/env python3
"""Loop verification on the final MP4:
 1) decode first, second, second-to-last and last frames; report mean abs diff (0-255)
    last->first (the wrap step) vs typical consecutive-frame steps;
 2) build a 3 s clip around the seam: last 1.5 s + first 1.5 s.
"""
import subprocess, sys, json, numpy as np
src, out = sys.argv[1], sys.argv[2]
probe = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
    "-show_entries", "stream=width,height,r_frame_rate,nb_read_frames", "-of", "json", src]))["streams"][0]
w, h = probe["width"], probe["height"]; n = int(probe["nb_read_frames"]); num, den = map(int, probe["r_frame_rate"].split("/")); fps = num / den
pr = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
fsz = w * h * 3
first = prev = None; steps = []; k = 0
while True:
    b = pr.stdout.read(fsz)
    if len(b) < fsz: break
    cur = np.frombuffer(b, np.uint8).astype(np.int16)
    if first is None: first = cur
    else: steps.append(float(np.abs(cur - prev).mean()))
    prev = cur; k += 1
pr.wait()
n = k
wrap = float(np.abs(prev - first).mean())
res = {"frames": n, "fps": fps, "duration_s": n / fps, "wrap_step_last_to_first": wrap,
       "consecutive_step_mean": float(np.mean(steps)), "consecutive_step_min": float(np.min(steps)),
       "consecutive_step_max": float(np.max(steps)),
       "wrap_step_ratio_to_mean": wrap / float(np.mean(steps)),
       "first_step_0_to_1": steps[0], "last_step_n-2_to_n-1": steps[-1]}
print(json.dumps(res, indent=1))
half = 1.5
subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-stream_loop", "1", "-i", src,
    "-vf", f"trim=start={n/fps - half}:end={n/fps + half},setpts=PTS-STARTPTS",
    "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", "-an", out])
print("seam clip:", out)
