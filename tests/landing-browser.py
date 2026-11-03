"""Static-root navigation and accessibility smoke; not a shader-render trial."""
import os
from pathlib import Path
import signal
import subprocess
import time
import urllib.request

from playwright.sync_api import expect, sync_playwright

ROOT=Path(__file__).resolve().parent.parent
URL='http://127.0.0.1:8766/'

def main():
    server=subprocess.Popen(['python3','-m','http.server','8766','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)
    try:
        for _ in range(80):
            try:
                with urllib.request.urlopen(URL,timeout=1) as response:
                    if response.status==200: break
            except OSError: time.sleep(.1)
        else: raise RuntimeError('landing server did not start')
        with sync_playwright() as p:
            browser=p.chromium.launch();page=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce')
            errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
            response=page.goto(URL,wait_until='domcontentloaded');assert response.status==200
            expect(page).to_have_title('Shader Gallery — Jennipher Troup (MelodicBloom)')
            expect(page.get_by_role('heading',name='Shader Gallery',exact=True)).to_be_visible()
            page.keyboard.press('Tab');cta=page.get_by_role('link',name='▶ Open the interactive gallery')
            expect(cta).to_be_focused()
            evidence=ROOT/'landing-evidence';evidence.mkdir(exist_ok=True)
            page.screenshot(path=str(evidence/'landing-desktop.png'))
            page.keyboard.press('Enter');page.wait_for_url('**/docs/')
            page.go_back(wait_until='domcontentloaded')
            for route in ('docs/','library-v1/','abalone/','aurora/'):
                result=page.request.get(URL+route);assert result.status==200,(route,result.status)
            page.set_viewport_size({'width':390,'height':844});page.evaluate('window.scrollTo(0,0)')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            expect(page.get_by_role('heading',name='Shader Gallery',exact=True)).to_be_visible()
            page.screenshot(path=str(evidence/'landing-mobile.png'))
            assert not errors,errors
            browser.close()
        print('PASS: local root keyboard navigation, four route responses, and mobile layout smoke')
    finally:
        try: os.killpg(server.pid,signal.SIGTERM)
        except ProcessLookupError: pass
        server.wait(timeout=10)

if __name__=='__main__': main()
