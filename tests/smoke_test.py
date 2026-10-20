from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import os
import re

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format_string, *args):
        pass


def main():
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", 8765), QuietHandler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    browser = None
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
            page.goto("http://127.0.0.1:8765/", wait_until="domcontentloaded")

            assert page.get_by_role("tab").count() == 5
            page.get_by_role("button", name=re.compile("Carregar Lote de Demonstração")).click()
            assert page.locator("#xml-tbody tr").count() == 5

            page.get_by_role("tab", name=re.compile("Conciliador Bancário")).click()
            page.get_by_role("button", name="Simulação").click()
            assert page.locator("#cb-bank-tbody tr").count() == 13
            assert page.locator("#cb-led-tbody tr").count() == 13

            page.get_by_role("tab", name=re.compile("Organizador Fiscal")).click()
            page.get_by_role("button", name="Carregar exemplos").click()
            assert page.locator("#og-tbody tr").count() == 6

            page.get_by_role("tab", name=re.compile("Contato")).click()
            assert page.locator("#contact-form").is_visible()
            page.get_by_role("tab", name=re.compile("Utilitários")).click()
            assert page.locator("#utilities-root section").count() == 4
            assert page.title() == "AutoContábil Hub | Utilitários"
            assert not errors, "Browser errors: " + " | ".join(errors)
    finally:
        if browser:
            browser.close()
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
