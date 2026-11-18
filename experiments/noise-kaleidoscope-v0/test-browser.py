"""WebGL2 draw and receipt smoke; renderer identity is reported explicitly."""
import json
import os
from pathlib import Path
import signal
import subprocess
import time
import urllib.request

from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8001/'


def main():
    server = subprocess.Popen(['python3', '-m', 'http.server', '8001', '--bind', '127.0.0.1'], cwd=Path(__file__).parent, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    try:
        for _ in range(50):
            try:
                with urllib.request.urlopen(URL, timeout=1) as response:
                    if response.status == 200:
                        break
            except OSError:
                time.sleep(0.1)
        else:
            raise RuntimeError('local test server did not start')
        with sync_playwright() as p:
            browser = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
            context = browser.new_context(viewport={'width': 1100, 'height': 800}, permissions=['clipboard-read', 'clipboard-write'])
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(URL, wait_until='networkidle')
            page.wait_for_function("document.querySelector('#status').textContent.includes('compiled and linked')")
            page.get_by_role('button', name='Play / Pause').click()
            page.get_by_role('button', name='Copy receipt').click()
            page.wait_for_function("document.querySelector('#status').textContent === 'Receipt copied'")
            receipt = json.loads(page.evaluate('navigator.clipboard.readText()'))
            observed = page.evaluate("""() => {
              const canvas = document.querySelector('#view');
              const gl = canvas.getContext('webgl2');
              const pixels = new Uint8Array(16 * 16 * 4);
              gl.readPixels(Math.floor(canvas.width/2)-8, Math.floor(canvas.height/2)-8, 16, 16, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
              const info = gl.getExtension('WEBGL_debug_renderer_info');
              return {width:canvas.width, height:canvas.height, renderer:info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), nonzero: pixels.some((v, i) => i % 4 !== 3 && v !== 0)};
            }""")
            assert receipt['viewport']['width'] == observed['width']
            assert receipt['viewport']['height'] == observed['height']
            assert receipt['controls']['sectors'] == 10 and observed['nonzero']
            assert not errors, errors
            print('PASS: WebGL2 draw and copied receipt; renderer=' + observed['renderer'])
            browser.close()
    finally:
        try:
            os.killpg(server.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        server.wait(timeout=10)


if __name__ == '__main__':
    main()
