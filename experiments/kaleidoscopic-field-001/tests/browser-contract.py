"""Hosted WebGL2 control/receipt smoke; software rendering is not device acceptance."""
import json
import hashlib
import os
from pathlib import Path
import signal
import subprocess
import time
import urllib.request

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parent.parent
EVIDENCE = ROOT / 'test-evidence'
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
            EVIDENCE.mkdir(exist_ok=True)
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
            page.goto(URL, wait_until='domcontentloaded')
            expect(page.locator('#engine-status')).to_have_text('WEBGL2 / GPU FIELD ACTIVE')
            page.get_by_text('REFERENCE SYNTH / 12 S').wait_for()
            assert page.locator('#segments').is_disabled()
            page.locator('#segment-mode').select_option('manual')
            page.locator('#segments').evaluate("el => { el.value='20'; el.dispatchEvent(new Event('input',{bubbles:true})); }")
            assert page.evaluate('window.__segments.slice(-2)')==[20,20]
            with page.expect_download() as event:
                page.locator('#receipt').click()
            target=EVIDENCE/'manual-receipt.json'; event.value.save_as(target)
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
                page.locator('#time').evaluate("el => { el.value='123'; el.dispatchEvent(new Event('input',{bubbles:true})); }")
            assert event.value.suggested_filename=='KF-001-frame-0.png'
            page.wait_for_function("Number(document.querySelector('#time').value) === 123 && !document.querySelector('#player').seeking",timeout=90000)
            png=EVIDENCE/'frame-0.png'; event.value.save_as(png)
            assert png.read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
            page.locator('#reset').click(timeout=90000)
            page.locator('#reduced').uncheck()
            page.locator('#player').evaluate('el => el.play()')
            expect(page.locator('#transport-status')).to_have_text('AUDIO LINKED')
            page.wait_for_function("Number(document.querySelector('#time').value) > 1", timeout=30000)
            page.locator('#player').evaluate('el => el.pause()')
            expect(page.locator('#transport-status')).to_have_text('PAUSED')
            paused=page.locator('#time').input_value()
            page.wait_for_timeout(500)
            assert page.locator('#time').input_value()==paused
            assert page.locator('#player').evaluate('el => el.paused')
            page.locator('#player').evaluate("el => { el.play=()=>new Promise((_,reject)=>setTimeout(()=>reject(new Error('test rejection')),2000)); }")
            page.locator('#play').click()
            page.locator('#reduced').check()
            page.wait_for_timeout(2200)
            expect(page.locator('#transport-status')).to_have_text('PAUSED')
            assert not errors, errors
            renderer=page.locator('#view').evaluate('''canvas => {
              const gl=canvas.getContext('webgl2'), ext=gl.getExtension('WEBGL_debug_renderer_info');
              return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
            }''')
            manifest={
                'checkout_sha':os.environ.get('GITHUB_SHA'), 'run_id':os.environ.get('GITHUB_RUN_ID'),
                'browser':browser.version, 'renderer':renderer,
                'checks':['both symmetry uniforms','manual receipt','preset grid draw count',
                          'delayed frame-zero capture name','frame 123 seek','native audio play and pause',
                          'cancelled audio start remains paused'],
                'artifacts':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (target,png)},
                'limitations':['automated control smoke, not visual acceptance or hardware performance',
                               'receipt and PNG are independent trial outputs, not a matched pair']
            }
            (EVIDENCE/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
            print('Renderer:',renderer)
            browser.close()
        print('PASS: WebGL2 uniform, modes, grid, capture frame and audio transport')
    finally:
        try:
            os.killpg(server.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        server.wait(timeout=10)

if __name__ == '__main__':
    main()
