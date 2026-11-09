"""Browser acceptance for editable values and candidate-only export."""
import json
import os
from pathlib import Path
import signal
import subprocess
import tempfile
import time
import urllib.request

from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8000/optical-studio/instruments/dispersion-lab/'


def main():
    server = subprocess.Popen(['npm', 'run', 'serve'], cwd=Path(__file__).parent, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
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
            browser = p.chromium.launch()
            page = browser.new_page(accept_downloads=True)
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(URL, wait_until='networkidle')
            nd = page.locator('#ndNumber')
            vd = page.locator('#vdNumber')
            export = page.locator('#export')
            page.get_by_role('button', name='Crown · N-BK7').click()
            with page.expect_download() as event:
                export.click()
            with tempfile.TemporaryDirectory() as tmp:
                target = Path(tmp) / 'crown.json'
                event.value.save_as(target)
                crown = json.loads(target.read_text())
            assert crown['presetId'] == 'crown' and crown['nd'] == 1.517 and crown['vd'] == 64.2
            vd.fill('')
            assert export.is_disabled()
            vd.fill('3')
            assert vd.input_value() == '3' and export.is_disabled()
            vd.fill('9.05')
            assert vd.input_value() == '9.05' and export.is_disabled()
            vd.fill('30')
            assert vd.input_value() == '30' and export.is_enabled()
            nd.fill('1')
            assert nd.input_value() == '1' and export.is_disabled()
            nd.fill('1.62')
            assert export.is_enabled()
            with page.expect_download() as event:
                export.click()
            with tempfile.TemporaryDirectory() as tmp:
                target = Path(tmp) / 'candidate.json'
                event.value.save_as(target)
                data = json.loads(target.read_text())
            assert data['nd'] == 1.62 and data['vd'] == 30
            assert data['presetId'] == 'custom' and 'candidate-only' in data['destination']
            # Typing keystroke by keystroke: no 0, no mid-typing clamp, aria-invalid + export blocked.
            vd.fill('')
            assert vd.input_value() == '' and vd.get_attribute('aria-invalid') == 'true' and export.is_disabled()
            vd.press_sequentially('3')
            assert vd.input_value() == '3' and vd.get_attribute('aria-invalid') == 'true' and export.is_disabled()
            vd.press_sequentially('0')
            assert vd.input_value() == '30' and vd.get_attribute('aria-invalid') == 'false' and export.is_enabled()
            # Empty field on blur stays empty and invalid (never becomes 0 or the minimum).
            vd.fill('')
            vd.blur()
            assert vd.input_value() == '' and vd.get_attribute('aria-invalid') == 'true' and export.is_disabled()
            export.click(force=True)  # disabled: must not download
            # A complete out-of-range number is clamped only at commit (blur/change).
            vd.fill('3')
            assert vd.input_value() == '3' and export.is_disabled()
            vd.blur()
            assert vd.input_value() == '9' and vd.get_attribute('aria-invalid') == 'false' and export.is_enabled()
            assert page.locator('#vd').input_value() == '9'
            nd.fill('')
            assert nd.get_attribute('aria-invalid') == 'true' and 'Refractive index' in page.locator('#error').inner_text()
            page.get_by_role('button', name='Crown · N-BK7').click()
            assert nd.get_attribute('aria-invalid') == 'false' and vd.get_attribute('aria-invalid') == 'false' and export.is_enabled()
            assert not errors, errors
            browser.close()
        print('PASS (software browser): intermediate input, aria-invalid, commit clamp, and candidate JSON download')
    finally:
        try:
            os.killpg(server.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        server.wait(timeout=10)


if __name__ == '__main__':
    main()
