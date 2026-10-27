from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import os
import re

ROOT = Path(__file__).resolve().parents[1]
TEXT_EXTENSIONS = {".html", ".js", ".css", ".md", ".json", ".webmanifest"}
MOJIBAKE_MARKERS = "".join(map(chr, (0x00C3, 0x00C2, 0x00E2)))
MOJIBAKE_EXTRA = "".join(map(chr, (
    0x0152, 0x0153, 0x0160, 0x0161, 0x0178, 0x017D, 0x017E, 0x0192,
    0x02C6, 0x02DC, 0x2013, 0x2014, 0x2018, 0x2019, 0x201A, 0x201C,
    0x201D, 0x201E, 0x2020, 0x2021, 0x2022, 0x2026, 0x2030, 0x2039,
    0x203A, 0x20AC, 0x2122,
)))
MOJIBAKE_RE = re.compile(
    r"[" + MOJIBAKE_MARKERS + r"][\u0080-\u00BF" + MOJIBAKE_EXTRA + r"]"
)

TOOL_PAGES = [
    "index.html",
    "ferramentas.html",
    "extrator-xml-nfe.html",
    "conciliador-bancario-ofx.html",
    "validador-cnpj.html",
]
FORBIDDEN_PATTERNS = re.compile(r"(supabase|js/portal)", re.IGNORECASE)
IMPORT_RE = re.compile(
    r"""(?:import\s+[^'"]*?from\s+|import\s*\(\s*|<script[^>]+src=["'])\s*['"]?([^'"\s>]+)""",
    re.IGNORECASE,
)


def check_privacy_guard(project_root=ROOT):
    visited = set()

    def inspect_file(file_path: Path, chain: str):
        resolved = file_path.resolve()
        if resolved in visited or not resolved.is_file():
            return
        visited.add(resolved)
        text = resolved.read_text(encoding="utf-8")
        match = FORBIDDEN_PATTERNS.search(text)
        if match:
            raise AssertionError(
                f"Privacy guard violation in {chain} ({resolved.relative_to(project_root)}): "
                f"found forbidden reference '{match.group(0)}'"
            )
        for ref in IMPORT_RE.findall(text):
            if ref.startswith(("http://", "https://", "//")):
                if FORBIDDEN_PATTERNS.search(ref):
                    raise AssertionError(
                        f"Privacy guard violation in {chain}: external reference '{ref}'"
                    )
                continue
            clean_ref = ref.split("?")[0].split("#")[0]
            if not clean_ref.endswith(".js"):
                continue
            target = (resolved.parent / clean_ref).resolve()
            inspect_file(target, f"{chain} -> {clean_ref}")

    for page_name in TOOL_PAGES:
        page_path = project_root / page_name
        assert page_path.is_file(), f"Missing tool page: {page_name}"
        inspect_file(page_path, page_name)

    for js_file in sorted((project_root / "js").glob("*.js")) + sorted((project_root / "js" / "ferramentas").glob("*.js")):
        inspect_file(js_file, str(js_file.relative_to(project_root)))


def check_project_text_encoding(project_root=ROOT):
    issues = []
    for path in sorted(project_root.rglob("*")):
        relative = path.relative_to(project_root)
        if not path.is_file() or {".git", "node_modules"}.intersection(relative.parts):
            continue
        if path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError as error:
            issues.append(f"{relative}: invalid UTF-8 ({error})")
            continue
        for line_number, line in enumerate(text.splitlines(), 1):
            if MOJIBAKE_RE.search(line):
                issues.append(f"{relative}:{line_number}: {line.strip()}")
    if issues:
        raise AssertionError("Mojibake or invalid UTF-8 found:\n" + "\n".join(issues))


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format_string, *args):
        pass


def main():
    check_project_text_encoding()
    check_privacy_guard()
    from playwright.sync_api import sync_playwright

    os.chdir(ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", 8765), QuietHandler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    browser = None
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            try:
                page = browser.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
                page.goto("http://127.0.0.1:8765/", wait_until="domcontentloaded")

                assert page.get_by_role("dialog", name="Como você quer usar?").is_visible()
                assert page.locator("#modo-overlay").get_by_text("Seus arquivos não saem do seu computador.", exact=True).is_visible()
                page.locator("#modo-guiado").click()
                assert page.locator("#panel-inicio").is_visible()
                assert page.get_by_text("O que você quer fazer?").is_visible()
                assert page.get_by_text("Aqui você não precisa saber nada de contabilidade. Escolha o que quer fazer e eu explico cada passo.").is_visible()
                assert page.get_by_text("Tenho notas fiscais e quero entender o que tem nelas").is_visible()
                assert page.get_by_text("Quero conferir se o que o banco mostra bate com o que anotei").is_visible()
                assert page.get_by_text("Quero arrumar meus documentos para mandar ao contador").is_visible()
                assert page.get_by_text("Conteúdo informativo. Não substitui a orientação do seu contador.").is_visible()
                assert page.get_by_role("tab").count() == 4
                page.reload(wait_until="domcontentloaded")
                assert not page.locator("#modo-overlay").is_visible()
                assert page.locator("body").get_attribute("data-modo") == "guiado"
                page.locator('#panel-inicio [data-go="xml"]').click()
                page.locator("#xml-demo").click()
                assert page.get_by_text("Estes dados são de exemplo, inventados para você ver como funciona.").is_visible()
                assert page.locator("#xml-tbody tr").count() == 5

                page.locator("#tab-conciliador").click()
                page.locator("#cb-demo").click()
                assert page.locator("#cb-bank-tbody tr").count() == 13
                assert page.locator("#cb-led-tbody tr").count() == 13

                page.locator("#tab-organizador").click()
                page.locator("#og-demo").click()
                assert page.locator("#og-tbody tr").count() == 6

                page.locator("#modo-toggle").click()
                assert page.locator("body").get_attribute("data-modo") == "completo"
                assert page.get_by_role("tab").count() == 5
                page.locator("#tab-contato").click()
                assert page.locator("#contact-form").is_visible()
                page.locator("#tab-utilitarios").click()
                assert page.locator("#utilities-root section").count() == 4
                assert page.title() == "AutoContábil Hub | Utilitários"

                # Testes do catálogo de ferramentas (ferramentas.html)
                page.goto("http://127.0.0.1:8765/ferramentas.html", wait_until="domcontentloaded")
                assert page.get_by_role("heading", name="Catálogo de Ferramentas").is_visible()
                catalog_counts = page.evaluate("""async () => {
                    const mod = await import('./js/ferramentas/catalogo.js');
                    const items = mod.CATALOGO_FERRAMENTAS;
                    return {
                        total: items.length,
                        fiscal: items.filter(i => i.area === 'fiscal').length,
                        contabil: items.filter(i => i.area === 'contabil').length,
                        financeiro: items.filter(i => i.area === 'financeiro').length
                    };
                }""")
                assert catalog_counts["total"] >= 5
                assert page.locator("#catalogo-grid [data-card-slug]").count() == catalog_counts["total"]

                page.locator('#catalogo-filtros-area button[data-area="fiscal"]').click()
                assert page.locator("#catalogo-grid [data-card-slug]").count() == catalog_counts["fiscal"]

                page.locator('#catalogo-filtros-area button[data-area="contabil"]').click()
                assert page.locator("#catalogo-grid [data-card-slug]").count() == catalog_counts["contabil"]

                page.locator('#catalogo-filtros-area button[data-area="financeiro"]').click()
                assert page.locator("#catalogo-grid [data-card-slug]").count() == catalog_counts["financeiro"]

                page.locator('#catalogo-filtros-area button[data-area="todas"]').click()
                assert page.locator("#catalogo-grid [data-card-slug]").count() == catalog_counts["total"]

                assert not errors, "Browser errors: " + " | ".join(errors)
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
