"""Hosted WebGL2 control/receipt smoke; software rendering is not device acceptance."""
import json
import os
from pathlib import Path
import signal
import subprocess
import tempfile
import time
import urllib.request

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parent.parent
URL = 'http://127.0.0.1:4177/'

def main():
    server = subprocess.Popen(['node', 'tools/serve.mjs'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    try:
        for _ in range(100):
            try:
                with urllib.request.urlopen(URL, timeout=1) as response:
                    if response.status == 200:
                        break
            except OSError:
                time.sleep(.1)
        else:
            raise RuntimeError('server did not start')
        with sync_playwright() as p:
            browser = p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
            page = browser.new_page(accept_downloads=True, reduced_motion='reduce')
            page.add_init_script('''
              window.__draws=[]; window.__segments=[];
              const gl=WebGL2RenderingContext.prototype, names=new WeakMap();
              const get=gl.getUniformLocation, set=gl.uniform1f, draw=gl.drawArrays;
              gl.getUniformLocation=function(p,n){const l=get.call(this,p,n);if(l)names.set(l,n);return l};
              gl.uniform1f=function(l,v){if(names.get(l)==='uSegments')window.__segments.push(v);return set.call(this,l,v)};
              gl.drawArrays=function(mode,first,count){if(mode===this.POINTS)window.__draws.push(count);return draw.call(this,mode,first,count)};
              const toBlob=HTMLCanvasElement.prototype.toBlob;
              HTMLCanvasElement.prototype.toBlob=function(cb,...args){return toBlob.call(this,blob=>setTimeout(()=>cb(blob),500),...args)};
            ''')
            errors=[]
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(URL, wait_until='networkidle')
            expect(page.locator('#engine-status')).to_have_text('WEBGL2 / GPU FIELD ACTIVE')
            page.get_by_text('REFERENCE SYNTH / 12 S').wait_for()
            assert page.locator('#segments').is_disabled()
            page.locator('#segment-mode').select_option('manual')
            page.locator('#segments').evaluate("el => { el.value='20'; el.dispatchEvent(new Event('input',{bubbles:true})); }")
            assert page.evaluate('window.__segments.slice(-2)')==[20,20]
            with page.expect_download() as event:
                page.locator('#receipt').click()
            with tempfile.TemporaryDirectory() as tmp:
                target=Path(tmp)/'receipt.json'; event.value.save_as(target)
                receipt=json.loads(target.read_text())
            assert receipt['capture']['schedule']['segments']==20
            assert receipt['capture']['schedule']['segmentSource']=='manual'
            page.locator('#segment-mode').select_option('schedule')
            assert page.locator('#segments').is_disabled()
            assert page.evaluate('window.__segments.slice(-2)')==[9,9]
            page.locator('#grid').evaluate("el => { el.value='72'; el.dispatchEvent(new Event('input',{bubbles:true})); }")
            assert page.evaluate('window.__draws.at(-1)')==72*72
            page.locator('[data-preset=proof]').click()
            assert page.evaluate('window.__draws.at(-1)')==216*216
            with page.expect_download() as event:
                page.locator('#capture').click()
                page.locator('#time').evaluate("el => { el.value='1'; el.dispatchEvent(new Event('input',{bubbles:true})); }")
            assert event.value.suggested_filename=='KF-001-frame-0.png'
            assert not errors, errors
            browser.close()
        print('PASS: WebGL2 uniform, reference/manual modes, grid preset and frame-zero downloads')
    finally:
        try:
            os.killpg(server.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        server.wait(timeout=10)

if __name__ == '__main__':
    main()
