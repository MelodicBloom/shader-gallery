"""Optional in-memory Chromium smoke: pip install playwright; playwright install chromium.
This route is useful even when local HTTP navigation is unavailable in CI sandboxes.
It validates controls but does not substitute for hosted/mobile performance QA.
"""
import asyncio
import base64
import os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]


async def run():
    core = base64.b64encode((ROOT / 'core.mjs').read_bytes()).decode()
    html = (ROOT / 'index.html').read_text().replace(
        "from './core.mjs'", f"from 'data:text/javascript;base64,{core}'"
    )
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True, executable_path=os.environ.get('CHROMIUM_PATH') or None)
        page = await browser.new_page(viewport={'width': 1250, 'height': 850}, accept_downloads=True)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        await page.set_content(html, wait_until='load')
        await page.wait_for_function("document.querySelector('#readout').textContent.includes('segments')")
        await page.get_by_role('button', name='Pause').click()
        baseline = await page.locator('#readout').inner_text()
        assert '10,260' in baseline and 'paused' in baseline, baseline
        await page.locator('#mode').select_option('radial')
        radial = await page.locator('#readout').inner_text()
        assert '1,140' in radial and 'radial' in radial, radial
        await page.locator('#mode').select_option('nested')
        for control, value in [('templates', '16'), ('points', '128')]:
            await page.locator('#' + control).evaluate("(el, v) => {el.value = v;el.dispatchEvent(new Event('input',{bubbles:true}))}", value)
        prior = await page.locator('#readout').inner_text()
        await page.locator('#copies').evaluate("(el) => {el.value = '24';el.dispatchEvent(new Event('input',{bubbles:true}))}")
        assert 'rejected' in (await page.locator('#error').inner_text()).lower()
        assert prior == (await page.locator('#readout').inner_text())
        await page.get_by_role('button', name='Reset').click()
        async with page.expect_download() as receipt:
            await page.get_by_role('button', name='Export receipt').click()
        assert (await receipt.value).suggested_filename.endswith('.json')
        async with page.expect_download() as png:
            await page.get_by_role('button', name='Save PNG').click()
        assert (await png.value).suggested_filename.endswith('.png')
        assert not errors, errors
        print('Chromium UI smoke PASS: pause, mode, bounded rejection, reset, JSON and PNG downloads; zero JS exceptions')
        await browser.close()


if __name__ == '__main__':
    asyncio.run(run())
