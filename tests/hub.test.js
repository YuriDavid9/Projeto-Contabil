import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseMoney, parseDateAny, csvCell, splitCSV, dayDiff } from '../js/utils.js';
import { reconcile, parseOFX, parseTxCSV, sim } from '../js/conciliadorModule.js';
import { calcDV, buildDemoXML, parseNFe, computeYearSummary } from '../js/xmlModule.js';
import { guessMeta, buildName } from '../js/organizadorModule.js';
import { isContactConfigured, isContactEmailConfigured, isContactEndpointConfigured, buildContactAlternativesHtml, resolveContactPrefill, CONTACT_ENDPOINT } from '../js/contactModule.js';
import { isHttpUrl, slugify, translatePostError, translateCommentError, translateAuthError } from '../js/portal/pure.js';
import { NEGOCIO, SERVICOS, FAIXAS_PRO, buildWhatsappLink, formatPrecoServico, isNegocioEmailConfigured } from '../js/negocio.js';
import { montarLinkCTA, shouldShowCTA, buildCTAHtml, dismissCTA, resetCTADismissals } from '../js/cta.js';
import { inspectWhatsappLinks } from '../scripts/verificar-links-wa.mjs';

test('parseMoney interpreta formatos brasileiros, americanos, negativos e preserva hifens internos', () => {
  assert.equal(parseMoney('1.234,56'), 1234.56);
  assert.equal(parseMoney('1234.56'), 1234.56);
  assert.equal(parseMoney('(100,00)'), -100);
  assert.equal(parseMoney('100,00 D'), -100);
  assert.equal(parseMoney('-50'), -50);
  assert.equal(parseMoney('50-'), -50);
  assert.equal(parseMoney('12-03'), 1203);
});

test('parseDateAny suporta 4 formatos de data', () => {
  assert.equal(parseDateAny('2026-10-05'), '2026-10-05');
  assert.equal(parseDateAny('05/10/2026'), '2026-10-05');
  assert.equal(parseDateAny('05/10/26'), '2026-10-05');
  assert.equal(parseDateAny('20261005120000'), '2026-10-05');
  assert.equal(dayDiff('2026-10-01', '2026-10-05'), 4);
});

test('csvCell aplica apostrofo apenas contra CSV injection e preserva negativos e hifens no meio', () => {
  assert.equal(csvCell('=SUM(A1:A5)'), "'=SUM(A1:A5)");
  assert.equal(csvCell('+cmd|calc'), "'+cmd|calc");
  assert.equal(csvCell('@malicioso'), "'@malicioso");
  assert.equal(csvCell('-50'), '-50');
  assert.equal(csvCell('-1.234,56'), '-1.234,56');
  assert.equal(csvCell('Pgto Beta - NF 7712'), 'Pgto Beta - NF 7712');
  assert.equal(csvCell('Texto; com ponto e vírgula'), '"Texto; com ponto e vírgula"');
});

test('splitCSV separa linhas com ponto-e-virgula, aspas escapadas e quebras de linha', () => {
  const csv = 'Data;Descrição;Valor\r\n"01/10/2026";"Cliente ""Alfa""; filial";1.500,00\n02/10/2026;Fornecedor Beta;-250,50';
  const rows = splitCSV(csv);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], ['Data', 'Descrição', 'Valor']);
  assert.deepEqual(rows[1], ['01/10/2026', 'Cliente "Alfa"; filial', '1.500,00']);
  assert.deepEqual(rows[2], ['02/10/2026', 'Fornecedor Beta', '-250,50']);
});

test('parseOFX e parseTxCSV leem transacoes e ignoram FITID duplicado', () => {
  const sampleOfx = `
    <OFX><BANKTRANLIST>
      <STMTTRN><FITID>TX001<DTPOSTED>20261001100000<TRNAMT>1250.45<NAME>PIX ALFA<MEMO>NF 10</STMTTRN>
      <STMTTRN><FITID>TX001<DTPOSTED>20261001100000<TRNAMT>1250.45<NAME>PIX ALFA<MEMO>NF 10</STMTTRN>
      <STMTTRN><FITID>TX002<DTPOSTED>20261002<TRNAMT>-89,90<NAME>TARIFA BANCARIA</STMTTRN>
    </BANKTRANLIST></OFX>
  `;
  const ofxList = parseOFX(sampleOfx);
  assert.equal(ofxList.length, 2);
  assert.equal(ofxList.ignoredDuplicates, 1);
  assert.equal(ofxList[0].amount, 1250.45);
  assert.equal(ofxList[1].amount, -89.9);

  const sampleCsv = 'Data;Historico;Valor\n01/10/2026;Recebimento Alfa;1.250,45\n02/10/2026;Tarifa;-89,90';
  const csvList = parseTxCSV(sampleCsv);
  assert.equal(csvList.length, 2);
  assert.equal(csvList[0].date, '2026-10-01');
  assert.equal(csvList[0].cents, 125045);
  assert.equal(csvList[1].cents, -8990);
});

test('reconcile identifica exatos, divergencias com similaridade, pendencias, tolerancia e duplicidade', () => {
  const bank = [
    { id: 1, date: '2026-10-02', desc: 'PIX RECEBIDO ALFA COMERCIO', amount: 1000, cents: 100000 },
    { id: 2, date: '2026-10-02', desc: 'PIX RECEBIDO ALFA COMERCIO', amount: 1000, cents: 100000 },
    { id: 3, date: '2026-10-05', desc: 'TED FORNECEDOR BETA MATERIAIS', amount: -510, cents: -51000 },
    { id: 4, date: '2026-10-06', desc: 'TARIFA CESTA PJ', amount: -45, cents: -4500 }
  ];
  const ledger = [
    { id: 10, date: '2026-10-01', desc: 'Recebimento Alfa Comércio', amount: 1000, cents: 100000 },
    { id: 11, date: '2026-10-05', desc: 'Pgto Beta Materiais NF 22', amount: -500, cents: -50000 },
    { id: 12, date: '2026-10-08', desc: 'Seguro Porto Azul', amount: -300, cents: -30000 },
    { id: 13, date: '2026-10-06', desc: 'Despesa totalmente distinta sem similaridade', amount: -44.5, cents: -4450 }
  ];

  const rows = reconcile(bank, ledger, { tol: 2, divDays: 10 });
  const okRows = rows.filter((r) => r.status === 'ok');
  const divRows = rows.filter((r) => r.status === 'div');
  const pbRows = rows.filter((r) => r.status === 'pb');
  const piRows = rows.filter((r) => r.status === 'pi');

  assert.equal(okRows.length, 1);
  assert.ok(okRows[0].obs.includes('possível duplicidade'));
  assert.equal(divRows.length, 1);
  assert.equal(divRows[0].b.id, 3);
  assert.equal(divRows[0].l.id, 11);
  // O lançamento 4 (-45) e o 13 (-44.50) têm diferença <= R$ 1,00 mas similaridade 0, portanto não devem parear como div
  assert.equal(pbRows.length, 2);
  assert.equal(piRows.length, 2);
});

test('calcDV, buildDemoXML e parseNFe validam chave, status e conferencia de totais', () => {
  const base43 = '2526101122233300018155001000001458111223344';
  const dv = calcDV(base43);
  assert.equal(typeof dv, 'number');
  assert.ok(dv >= 0 && dv <= 9);

  const xml = buildDemoXML({
    cUF: 25,
    mod: 55,
    serie: 1,
    nNF: 1458,
    cNF: 11223344,
    dt: '2026-10-02',
    hora: '11:20',
    icms: 0.18,
    emit: { doc: '11222333000181', nome: 'Alfa LTDA' },
    dest: { doc: '44555666000122', nome: 'Beta ME' },
    itens: [{ desc: 'Produto A', q: 2, vu: 50 }]
  });
  const parsed = parseNFe(xml, 'nota.xml');
  assert.equal(parsed.chave, base43 + dv);
  assert.equal(parsed.chaveValid, true);
  assert.equal(parsed.status, 'autorizada');
  assert.equal(parsed.totalsOk, true);

  const canceledBadTotal = xml.replace('<cStat>100</cStat>', '<cStat>101</cStat>').replace('<vNF>100.00</vNF>', '<vNF>120.00</vNF>');
  const parsedBad = parseNFe(canceledBadTotal, 'cancelada.xml');
  assert.equal(parsedBad.status, 'cancelada');
  assert.equal(parsedBad.validForKpi, false);
  assert.equal(parsedBad.totalsOk, false);
  assert.ok(parsedBad.avisoConferencia.includes('totais não conferem'));

  const baseNote = {
    cUF: 25,
    mod: 55,
    serie: 1,
    nNF: 2000,
    cNF: 11223344,
    dt: '2026-10-05',
    hora: '10:00',
    icms: 0.18,
    emit: { doc: '11222333000181', nome: 'Alfa LTDA' },
    dest: { doc: '44555666000122', nome: 'Beta ME' },
    itens: [{ desc: 'Item', q: 1, vu: 100 }]
  };
  const notes = ['100', '150', '101', '110'].map((cStat, idx) =>
    parseNFe(buildDemoXML({ ...baseNote, nNF: 2000 + idx, cStat }), `n_${cStat}.xml`)
  );
  const summary = computeYearSummary(notes, '11.222.333/0001-81');
  assert.equal(summary.validas.length, 2);
  assert.equal(summary.desconsideradas, 2);
  assert.equal(summary.groups.get('2026').total, 200);
  assert.equal(summary.groups.get('2026').emitidas, 200);
});

test('guessMeta preserva fornecedores como Mar Azul e Dez Distribuidora e buildName limita a 120 chars', () => {
  const m1 = guessMeta('boleto_mar_azul_2026-10-05.pdf');
  assert.equal(m1.fornecedor, 'Mar Azul');
  assert.equal(m1.tipo, 'BOLETO');
  assert.equal(m1.data, '2026-10-05');

  const m2 = guessMeta('nfe_dez_distribuidora_2026-10-12_final_scan.pdf');
  assert.equal(m2.fornecedor, 'Dez Distribuidora');
  assert.equal(m2.tipo, 'NFE');

  const longFile = buildName(
    { data: '2026-10-05', tipo: 'DOCUMENTO', fornecedor: 'Fornecedor Muito Longo '.repeat(10), valor: '100', ext: 'pdf' },
    '{AAAA}-{MM}-{DD}_{TIPO}_{FORNECEDOR}_{VALOR}'
  );
  const baseWithoutExt = longFile.replace(/\.pdf$/, '');
  assert.ok(baseWithoutExt.length <= 120);
});

test('contactModule valida configuracao de endpoint e e-mail e omite mailto quando nao configurado', () => {
  assert.equal(isContactConfigured(), false);
  assert.equal(isContactEndpointConfigured('COLOQUE_AQUI_O_ENDPOINT', ''), false);
  assert.equal(isContactEndpointConfigured('http://inseguro.com/api', ''), false);
  assert.equal(isContactEndpointConfigured('https://api.web3forms.com/submit', ''), false);
  assert.equal(isContactEndpointConfigured('https://api.web3forms.com/submit', 'chave-valida'), true);
  assert.equal(isContactEndpointConfigured('https://formspree.io/f/xyz123', ''), true);

  assert.equal(isContactEmailConfigured('SEU_EMAIL@EXEMPLO.COM'), false);
  assert.equal(isContactEmailConfigured('contato@exemplo.com'), false);
  assert.equal(isContactEmailConfigured('contato@autocontabil.com.br'), true);

  assert.equal(isContactConfigured('https://formspree.io/f/xyz123', 'SEU_EMAIL@EXEMPLO.COM'), false);
  assert.equal(isContactConfigured('https://formspree.io/f/xyz123', 'contato@autocontabil.com.br'), true);

  const unconfiguredHtml = buildContactAlternativesHtml('SEU_EMAIL@EXEMPLO.COM', 'https://wa.me/5583986398472');
  assert.equal(unconfiguredHtml.includes('mailto:'), false);
  assert.equal(unconfiguredHtml.includes('https://wa.me/5583986398472'), true);

  const configuredHtml = buildContactAlternativesHtml('contato@autocontabil.com.br', 'https://wa.me/5583986398472');
  assert.equal(configuredHtml.includes('mailto:contato@autocontabil.com.br'), true);
  assert.equal(configuredHtml.includes('https://wa.me/5583986398472'), true);

  assert.equal(resolveContactPrefill('?assunto=parceria').subject, 'Quero ser parceiro');
  assert.ok(resolveContactPrefill('?assunto=parceria&modelo=colunista').messagePlaceholder.includes('Colunista'));
  assert.ok(resolveContactPrefill('?assunto=parceria&modelo=vitrine').messagePlaceholder.includes('Vitrine'));
  assert.ok(resolveContactPrefill('?assunto=parceria&modelo=tecnica').messagePlaceholder.includes('Escritório Contábil'));
  assert.equal(resolveContactPrefill('?assunto=sugestao').subject, 'Sugestão/feedback');
  assert.equal(resolveContactPrefill('?assunto=servico').subject, 'Contratar serviço');
  assert.equal(resolveContactPrefill('').subject, '');
});

test('isHttpUrl e funcoes puras do portal validam URLs HTTP/HTTPS, slugs e traduzem erros de constraints', () => {
  assert.equal(isHttpUrl('https://www.gov.br/receitafederal'), true);
  assert.equal(isHttpUrl('http://exemplo.com/imagem.png'), true);
  assert.equal(isHttpUrl('javascript:alert(1)'), false);
  assert.equal(isHttpUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isHttpUrl('ftp://arquivos.com/doc.pdf'), false);
  assert.equal(isHttpUrl(''), false);

  assert.equal(slugify('Reforma Tributária 2026: O que muda no Simples?'), 'reforma-tributaria-2026-o-que-muda-no-simples');
  assert.equal(slugify('   ---NFC-e & NF-e: Guia Prático!---   '), 'nfc-e-nf-e-guia-pratico');
  assert.equal(slugify('a'.repeat(150)).length, 120);
  assert.equal(slugify(''), '');

  assert.equal(translatePostError(new Error('duplicate key value violates unique constraint "posts_slug_key"')), 'Já existe uma notícia com este slug (endereço). Escolha outro slug.');
  assert.equal(translatePostError(new Error('violates check constraint "posts_slug_check"')), 'O slug deve conter apenas letras minúsculas, números e hífens (ex.: minha-noticia-1).');
  assert.equal(translatePostError(new Error('violates check constraint "posts_title_check"')), 'O título deve ter entre 5 e 160 caracteres.');
  assert.equal(translatePostError(new Error('violates check constraint "posts_summary_check"')), 'O resumo deve ter no máximo 300 caracteres.');
  assert.equal(translatePostError(new Error('violates check constraint "posts_source_url_check"')), 'O link da fonte deve começar com http:// ou https://.');
  assert.equal(translatePostError(new Error('violates check constraint "posts_cover_url_check"')), 'A URL da imagem de capa deve começar com http:// ou https://.');
  assert.equal(translatePostError(new Error('new row violates row-level security policy')), 'Acesso negado pelo banco de dados. Apenas administradores podem salvar notícias.');
  assert.equal(translatePostError(''), 'Não foi possível salvar a notícia.');

  assert.equal(translateCommentError(new Error('Aguarde alguns segundos antes de comentar novamente.')), 'Aguarde 20 segundos antes de enviar outro comentário.');
  assert.equal(translateCommentError(new Error('violates check constraint "comments_body_check"')), 'O comentário deve ter entre 2 e 1000 caracteres.');
  assert.equal(translateCommentError(new Error('permission denied for table comments')), 'Você não tem permissão para realizar esta ação. Faça login novamente.');
  assert.equal(translateCommentError(''), 'Não foi possível concluir a operação nos comentários.');

  assert.equal(translateAuthError(new Error('User already registered')), 'Este e-mail já está cadastrado. Tente fazer login ou recuperar sua senha.');
  assert.equal(translateAuthError(new Error('Invalid login credentials')), 'E-mail ou senha incorretos. Confira os dados e tente novamente.');
  assert.equal(translateAuthError(new Error('Email not confirmed')), 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (e a pasta de spam) e clique no link de confirmação.');
  assert.equal(translateAuthError(new Error('Password should be at least 8 characters')), 'A senha deve ter pelo menos 8 caracteres.');
  assert.equal(translateAuthError(new Error('over_email_send_rate_limit')), 'Muitas tentativas seguidas ou limite de envio de e-mails atingido. Aguarde alguns minutos e tente novamente.');
  assert.equal(translateAuthError(new Error('Unable to validate email address: invalid format')), 'Digite um endereço de e-mail válido.');
  assert.equal(translateAuthError({}), 'Ocorreu um erro inesperado. Tente novamente.');
});

test('reconcile mantem paridade exata com implementacao de referencia (300x300) e processa 3000x3000 em menos de 3s', () => {
  const vendors = ['ALFA COMERCIO', 'BETA DISTRIBUIDORA', 'GAMMA SERVICOS', 'DELTA MATERIAIS', 'EPSILON TECH', 'ZETA LOGISTICA', 'THETA CONSULTORIA', 'IOTA EMBALAGENS', 'KAPPA SUPRIMENTOS', 'LAMBDA SEGUROS'];
  const buildDataset = (count) => {
    const bank = [];
    const ledger = [];
    for (let i = 0; i < count; i++) {
      const month = String((i % 12) + 1).padStart(2, '0');
      const dayNum = (i % 27) + 1;
      const day = String(dayNum).padStart(2, '0');
      const nextDay = String(Math.min(28, dayNum + (i % 2))).padStart(2, '0');
      const vendor = vendors[i % vendors.length];
      const baseCents = ((i * 137) % 90000) + 1000;
      const sign = i % 3 === 0 ? 1 : -1;
      const bCents = sign * baseCents;
      bank.push({
        id: i + 1,
        date: `2026-${month}-${day}`,
        desc: `PIX ${vendor} LOTE ${i}`,
        amount: bCents / 100,
        cents: bCents
      });
      let lCents = bCents;
      let lDesc = `Lancamento ${vendor} ref ${i}`;
      if (i % 5 === 1) {
        lCents = bCents + sign * 50; // divergencia com similaridade
      } else if (i % 5 === 2) {
        lCents = bCents + sign * 50000; // pendencia
        lDesc = 'Historico isolado sem correspondencia';
      }
      ledger.push({
        id: count + i + 1,
        date: `2026-${month}-${nextDay}`,
        desc: lDesc,
        amount: lCents / 100,
        cents: lCents
      });
    }
    return { bank, ledger };
  };

  const referenceReconcileCounts = (bank, ledger, tol = 2, divDays = 10) => {
    const usedB = new Set();
    const usedL = new Set();
    const exact = [];
    for (const b of bank) {
      for (const l of ledger) {
        if (b.cents !== l.cents) continue;
        const dd = dayDiff(b.date, l.date);
        if (dd <= tol) exact.push({ bank: b, ledger: l, score: sim(b.desc, l.desc) * 10 - dd });
      }
    }
    exact.sort((a, b) => b.score - a.score);
    let ok = 0;
    for (const c of exact) {
      if (usedB.has(c.bank.id) || usedL.has(c.ledger.id)) continue;
      usedB.add(c.bank.id);
      usedL.add(c.ledger.id);
      ok++;
    }
    const divCandidates = [];
    for (const b of bank) {
      if (usedB.has(b.id)) continue;
      for (const l of ledger) {
        if (usedL.has(l.id) || Math.sign(b.cents) !== Math.sign(l.cents)) continue;
        const dd = dayDiff(b.date, l.date);
        const s = sim(b.desc, l.desc);
        const diff = Math.abs(b.cents - l.cents);
        const ratio = diff / Math.max(Math.abs(l.cents), 1);
        if (dd <= divDays && s > 0 && (ratio <= 0.25 || diff <= 100)) {
          divCandidates.push({ bank: b, ledger: l, score: s * 10 - dd - ratio * 10 });
        }
      }
    }
    divCandidates.sort((a, b) => b.score - a.score);
    let div = 0;
    for (const c of divCandidates) {
      if (usedB.has(c.bank.id) || usedL.has(c.ledger.id)) continue;
      usedB.add(c.bank.id);
      usedL.add(c.ledger.id);
      div++;
    }
    return { ok, div, pb: bank.length - usedB.size, pi: ledger.length - usedL.size };
  };

  const small = buildDataset(300);
  const expectedSmall = referenceReconcileCounts(small.bank, small.ledger, 2, 10);
  const actualSmallRows = reconcile(small.bank, small.ledger, { tol: 2, divDays: 10 });
  const actualSmall = {
    ok: actualSmallRows.filter((r) => r.status === 'ok').length,
    div: actualSmallRows.filter((r) => r.status === 'div').length,
    pb: actualSmallRows.filter((r) => r.status === 'pb').length,
    pi: actualSmallRows.filter((r) => r.status === 'pi').length
  };
  assert.deepEqual(actualSmall, expectedSmall);

  const large = buildDataset(3000);
  const start = performance.now();
  const largeRows = reconcile(large.bank, large.ledger, { tol: 2, divDays: 10 });
  const elapsedMs = performance.now() - start;
  assert.ok(largeRows.length >= 3000);
  assert.ok(elapsedMs < 3000, `Esperado < 3000ms para 3000x3000, levou ${elapsedMs.toFixed(1)}ms`);
});

test('sw.js CORE_ASSETS contem todos os modulos locais importados por index.html e CSP das ferramentas isola connect-src', () => {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const swText = fs.readFileSync(path.join(rootDir, 'sw.js'), 'utf8');
  const coreMatch = /const\s+CORE_ASSETS\s*=\s*\[([\s\S]*?)\];/.exec(swText);
  assert.ok(coreMatch, 'CORE_ASSETS deve existir em sw.js');
  const coreAssets = new Set([...coreMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]));

  const importRe = /(?:import\s+[^'"]*?from\s+|import\s*\(\s*|<script[^>]+src=["'])\s*['"]?([^'"\s>]+)/gi;
  const visited = new Set();

  function walk(filePath) {
    const resolved = path.resolve(filePath);
    if (visited.has(resolved) || !fs.existsSync(resolved)) return;
    visited.add(resolved);
    const content = fs.readFileSync(resolved, 'utf8');
    for (const match of content.matchAll(importRe)) {
      const ref = match[1];
      if (/^(https?:)?\/\//i.test(ref)) continue;
      const cleanRef = ref.split('?')[0].split('#')[0];
      if (!cleanRef.endsWith('.js')) continue;
      const target = path.resolve(path.dirname(resolved), cleanRef);
      const rel = './' + path.relative(rootDir, target).replace(/\\/g, '/');
      assert.ok(coreAssets.has(rel), `Modulo local ${rel} ausente de CORE_ASSETS em sw.js`);
      walk(target);
    }
  }

  walk(path.join(rootDir, 'index.html'));
  walk(path.join(rootDir, 'contato.html'));
  walk(path.join(rootDir, 'pro.html'));

  const strictToolPages = [
    'index.html',
    'ferramentas.html',
    'extrator-xml-nfe.html',
    'conciliador-bancario-ofx.html',
    'organizador-fiscal.html',
    'validador-cnpj.html'
  ];

  for (const page of strictToolPages) {
    const html = fs.readFileSync(path.join(rootDir, page), 'utf8');
    const forms = [...html.matchAll(/<form\b([^>]*)>/gi)];
    for (const formMatch of forms) {
      const attrs = formMatch[1] || '';
      const isLocalLedgerForm = page === 'index.html' && /\bid=["']cb-led-form["']/i.test(attrs) && !/\baction=/i.test(attrs);
      assert.ok(isLocalLedgerForm, `Pagina de ferramenta ${page} nao pode conter <form de envio externo (encontrado: <form${attrs}>)`);
    }
  }

  const toolPages = [
    'index.html',
    'ferramentas.html',
    'servicos.html',
    'parceiros.html',
    'extrator-xml-nfe.html',
    'conciliador-bancario-ofx.html',
    'organizador-fiscal.html',
    'validador-cnpj.html',
    'guias/index.html',
    'guias/como-consolidar-xml-nfe-excel.html',
    'guias/como-conciliar-extrato-ofx-razao-contabil.html',
    'guias/cnpj-alfanumerico-o-que-muda-como-validar.html'
  ];
  const allowedHosts = new Set([
    'cdn.tailwindcss.com',
    'cdnjs.cloudflare.com',
    'cdn.jsdelivr.net',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ]);
  for (const page of toolPages) {
    const html = fs.readFileSync(path.join(rootDir, page), 'utf8');
    const cspMatch = /<meta\s+http-equiv=["']Content-Security-Policy["']\s+content="([^"]+)"/i.exec(html);
    assert.ok(cspMatch, `CSP ausente em ${page}`);
    const connectMatch = /connect-src\s+([^;]+)/i.exec(cspMatch[1]);
    assert.ok(connectMatch, `connect-src ausente em ${page}`);
    assert.equal(connectMatch[1].trim(), "'self'", `connect-src deve ser estritamente 'self' em ${page}`);
    for (const hostMatch of cspMatch[1].matchAll(/https:\/\/([^\s;/"']+)/g)) {
      assert.ok(allowedHosts.has(hostMatch[1]), `Dominio nao autorizado ${hostMatch[1]} no CSP de ${page}`);
    }
    assert.equal(/supabase/i.test(cspMatch[1]), false, `CSP de ${page} nao pode conter dominio do Supabase`);
  }
});

test('negocio.js define configuracao sem precos inventados e buildWhatsappLink codifica acentos, espacos e quebras de linha', () => {
  assert.equal(NEGOCIO.whatsapp, '5583986398472');
  assert.equal(NEGOCIO.email, null);
  assert.equal(isNegocioEmailConfigured(NEGOCIO.email), false);
  assert.equal(isNegocioEmailConfigured('contato@autocontabil.com.br'), true);
  assert.ok(Array.isArray(SERVICOS) && SERVICOS.length >= 3);
  assert.ok(Array.isArray(FAIXAS_PRO) && FAIXAS_PRO.length >= 4);

  for (const servico of SERVICOS) {
    const preco = servico.precoAPartirDe;
    const valido = preco === null
      || (typeof preco === 'number' && Number.isFinite(preco) && preco > 0)
      || (typeof preco === 'string' && /^R\$\s?\d/.test(preco.trim()));
    assert.ok(valido, `Servico ${servico.slug} deve ter precoAPartirDe null, numero positivo ou texto iniciando com R$`);
    if (preco === null) assert.equal(formatPrecoServico(preco), 'Solicitar orçamento');
    else assert.ok(formatPrecoServico(preco).startsWith('A partir de R$'));
  }
  assert.equal(formatPrecoServico(null), 'Solicitar orçamento');
  assert.equal(formatPrecoServico(350), 'A partir de R$ 350,00');

  const linkXml = buildWhatsappLink({
    origem: 'Extrator de XML',
    servico: 'consolidação de lotes de XML\nVolume: 300 notas/mês'
  });
  assert.ok(linkXml.startsWith('https://wa.me/5583986398472?text='));
  assert.ok(linkXml.includes('%C3%A1'), 'Deve codificar acentos em UTF-8 percent-encoded');
  assert.ok(linkXml.includes('%20'), 'Deve codificar espacos como %20');
  assert.ok(linkXml.includes('%0A'), 'Deve codificar quebra de linha como %0A');

  const decoded = decodeURIComponent(linkXml.split('?text=')[1]);
  assert.equal(
    decoded,
    'Olá Yuri! Vim pelo Extrator de XML do AutoContábil Hub e quero falar sobre consolidação de lotes de XML\nVolume: 300 notas/mês.'
  );

  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const servicosHtml = fs.readFileSync(path.join(rootDir, 'servicos.html'), 'utf8');
  assert.ok(servicosHtml.includes('"@type": "ProfessionalService"'), 'servicos.html deve ter JSON-LD ProfessionalService');
  assert.ok(servicosHtml.includes('Solicitar orçamento'), 'servicos.html deve manter o CTA Solicitar orçamento');
  for (const servico of SERVICOS) {
    assert.ok(servicosHtml.includes(formatPrecoServico(servico.precoAPartirDe)), `servicos.html deve exibir no HTML estatico o preco de ${servico.slug}`);
  }
  assert.equal(servicosHtml.includes('mailto:null'), false, 'servicos.html nunca deve exibir e-mail nulo');
  const sitemapXml = fs.readFileSync(path.join(rootDir, 'sitemap.xml'), 'utf8');
  assert.ok(sitemapXml.includes('/servicos.html'), 'servicos.html deve constar no sitemap.xml');
  assert.ok(sitemapXml.includes('/parceiros.html'), 'parceiros.html deve constar no sitemap.xml');
  assert.ok(sitemapXml.includes('/pro.html'), 'pro.html deve constar no sitemap.xml');

  const proHtml = fs.readFileSync(path.join(rootDir, 'pro.html'), 'utf8');
  assert.ok(proHtml.includes('em validação, ainda não disponível'), 'pro.html deve deixar claro que esta em validacao');
  assert.ok(proHtml.includes('pro-unconfigured-notice'), 'pro.html deve ter aviso para estado nao configurado');

  const guideFiles = [
    'guias/como-consolidar-xml-nfe-excel.html',
    'guias/como-conciliar-extrato-ofx-razao-contabil.html',
    'guias/cnpj-alfanumerico-o-que-muda-como-validar.html'
  ];
  const swText = fs.readFileSync(path.join(rootDir, 'sw.js'), 'utf8');
  assert.ok(swText.includes('./servicos.html'));
  assert.ok(swText.includes('./parceiros.html'));
  assert.ok(swText.includes('./pro.html'));
  assert.ok(swText.includes('./guias/index.html'));
  for (const guide of guideFiles) {
    assert.ok(sitemapXml.includes(`/${guide}`), `${guide} deve constar no sitemap.xml`);
    assert.ok(swText.includes(`./${guide}`), `${guide} deve constar em CORE_ASSETS do sw.js`);
    const gHtml = fs.readFileSync(path.join(rootDir, guide), 'utf8');
    assert.ok(gHtml.includes('Fontes oficiais consultadas (Verificado em: 11/11/2026)'), `${guide} deve citar fontes oficiais com data de verificacao`);
    assert.ok(gHtml.includes('"@type": "Article"'), `${guide} deve ter JSON-LD Article`);
    assert.ok(gHtml.includes('../servicos.html'), `${guide} deve ter link para servicos.html`);
  }

  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('href="extrator-xml-nfe.html"'), 'index.html deve ter link estatico para extrator-xml-nfe.html');
  assert.ok(indexHtml.includes('href="conciliador-bancario-ofx.html"'), 'index.html deve ter link estatico para conciliador-bancario-ofx.html');
});

test('contato.html e pro.html possuem CSP estatico e nenhum arquivo altera meta CSP via JavaScript', () => {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const sitemapXml = fs.readFileSync(path.join(rootDir, 'sitemap.xml'), 'utf8');
  const swText = fs.readFileSync(path.join(rootDir, 'sw.js'), 'utf8');

  assert.ok(sitemapXml.includes('/contato.html'), 'contato.html deve constar no sitemap.xml');
  assert.ok(swText.includes('./contato.html'), 'contato.html deve constar em CORE_ASSETS do sw.js');

  const providerOrigin = new URL(CONTACT_ENDPOINT).origin;
  assert.equal(providerOrigin, 'https://api.web3forms.com', 'Provedor de formulario configurado deve ser o Web3Forms');
  for (const formPage of ['contato.html', 'pro.html']) {
    const html = fs.readFileSync(path.join(rootDir, formPage), 'utf8');
    assert.ok(
      html.includes('Provedor do formulário: Web3Forms'),
      `${formPage} deve ter comentario explicando o provedor liberado no connect-src estatico`
    );
    const cspMatch = /<meta\s+http-equiv=["']Content-Security-Policy["']\s+content="([^"]+)"/i.exec(html);
    assert.ok(cspMatch, `CSP estatico ausente em ${formPage}`);
    const connectMatch = /connect-src\s+([^;]+)/i.exec(cspMatch[1]);
    assert.ok(connectMatch, `connect-src ausente em ${formPage}`);
    assert.equal(connectMatch[1].trim(), `'self' ${providerOrigin}`, `connect-src de ${formPage} deve liberar apenas 'self' e a origem do provedor`);
  }

  const allFilesToCheck = [];
  function collectFiles(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'tests') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectFiles(fullPath);
      } else if (entry.name.endsWith('.html') || entry.name.endsWith('.js')) {
        allFilesToCheck.push(fullPath);
      }
    }
  }
  collectFiles(rootDir);

  for (const filePath of allFilesToCheck) {
    const content = fs.readFileSync(filePath, 'utf8');
    const rel = path.relative(rootDir, filePath);
    assert.equal(
      /pro-csp|getEndpointOrigin/i.test(content),
      false,
      `${rel} nao deve conter alteracao dinamica de meta CSP (pro-csp / getEndpointOrigin)`
    );
    const altersCspMeta = /Content-Security-Policy[\s\S]{0,200}setAttribute\s*\(\s*['"]content['"]/i.test(content)
      || /cspMeta\s*\.\s*setAttribute\s*\(\s*['"]content['"]/i.test(content);
    assert.equal(altersCspMeta, false, `${rel} nao deve alterar meta CSP em tempo de execucao via setAttribute('content')`);
  }
});

test('todos os links wa.me nos arquivos HTML usam NEGOCIO.whatsapp com origem e elementos data-wa-origem batem com buildWhatsappLink', () => {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const { links, errors } = inspectWhatsappLinks(rootDir, NEGOCIO.whatsapp);

  assert.ok(links.length >= 25, `Esperados pelo menos 25 links wa.me no projeto, encontrados ${links.length}`);
  assert.deepEqual(errors, [], `Erros encontrados nos links wa.me:\n${errors.join('\n')}`);

  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const dataWaTags = [...indexHtml.matchAll(/<a\b[^>]*\bdata-wa-origem=["']([^"']+)["'][^>]*>/gi)];
  assert.ok(dataWaTags.length >= 6, 'index.html deve ter pelo menos 6 links com data-wa-origem');

  for (const match of dataWaTags) {
    const tag = match[0];
    const origem = match[1];
    const servicoMatch = /\bdata-wa-servico=["']([^"']+)["']/i.exec(tag);
    const hrefMatch = /\bhref=["']([^"']+)["']/i.exec(tag);
    const servico = servicoMatch ? servicoMatch[1] : undefined;
    const expectedHref = buildWhatsappLink({ origem, servico });
    assert.equal(hrefMatch?.[1], expectedHref, `href estatico de data-wa-origem="${origem}" em index.html deve ser identico a buildWhatsappLink`);
  }

  const mismatchCheck = inspectWhatsappLinks(rootDir, '5511999999999');
  assert.ok(mismatchCheck.errors.length > 0, 'inspectWhatsappLinks deve detectar divergencia quando o numero muda');
});

test('privacidade.html nomeia Web3Forms (LGPD) e paginas de ferramentas mantem connect-src self sem api.web3forms.com', () => {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const privacidadeHtml = fs.readFileSync(path.join(rootDir, 'privacidade.html'), 'utf8');

  assert.ok(privacidadeHtml.includes('Web3Forms'), 'privacidade.html deve nomear Web3Forms como operador');
  assert.ok(privacidadeHtml.includes('api.web3forms.com'), 'privacidade.html deve citar api.web3forms.com');
  assert.ok(privacidadeHtml.includes('12 meses'), 'privacidade.html deve informar prazo de retencao definido');
  assert.equal(privacidadeHtml.includes('[A DEFINIR PELO DONO]'), false, 'privacidade.html nao deve manter marcador [A DEFINIR PELO DONO]');

  const toolPages = [
    'index.html',
    'ferramentas.html',
    'extrator-xml-nfe.html',
    'conciliador-bancario-ofx.html',
    'organizador-fiscal.html',
    'validador-cnpj.html'
  ];

  for (const page of toolPages) {
    const html = fs.readFileSync(path.join(rootDir, page), 'utf8');
    const cspMatch = /<meta\s+http-equiv=["']Content-Security-Policy["']\s+content="([^"]+)"/i.exec(html);
    assert.ok(cspMatch, `CSP ausente em ${page}`);
    const connectMatch = /connect-src\s+([^;]+)/i.exec(cspMatch[1]);
    assert.ok(connectMatch, `connect-src ausente em ${page}`);
    assert.equal(connectMatch[1].trim(), "'self'", `${page} deve manter connect-src 'self'`);
    assert.equal(/api\.web3forms\.com/i.test(html), false, `${page} nao pode conter api.web3forms.com`);
  }
});

test('cta.js monta links wa.me apenas com contagens agregadas e exibe blocos nos limiares corretos', () => {
  resetCTADismissals();

  const linkXml = montarLinkCTA('xml', 42);
  assert.ok(linkXml && linkXml.startsWith(`https://wa.me/${NEGOCIO.whatsapp}?text=`));
  const rawQueryXml = linkXml.split('?text=')[1];
  assert.equal(/[ \n\r]/.test(rawQueryXml), false, 'Query ?text= nao pode conter espacos ou quebras de linha soltos');
  const decodedXml = decodeURIComponent(rawQueryXml);
  assert.ok(decodedXml.includes('42 notas'));
  assert.ok(decodedXml.includes('Extrator de XML'));

  const linkConc = montarLinkCTA('conciliador', 3);
  assert.ok(linkConc && linkConc.startsWith(`https://wa.me/${NEGOCIO.whatsapp}?text=`));
  assert.ok(decodeURIComponent(linkConc.split('?text=')[1]).includes('3 pendências ou divergências'));

  const linkOrg = montarLinkCTA('organizador', 6);
  assert.ok(linkOrg && linkOrg.startsWith(`https://wa.me/${NEGOCIO.whatsapp}?text=`));
  assert.ok(decodeURIComponent(linkOrg.split('?text=')[1]).includes('6 documentos'));

  // Tipos e contagens invalidos devem retornar null
  assert.equal(montarLinkCTA('invalido', 10), null);
  assert.equal(montarLinkCTA('', 10), null);
  assert.equal(montarLinkCTA(null, 10), null);
  assert.equal(montarLinkCTA('xml', -1), null);
  assert.equal(montarLinkCTA('xml', NaN), null);
  assert.equal(montarLinkCTA('xml', Infinity), null);
  assert.equal(montarLinkCTA('xml', 10.5), null);
  assert.equal(montarLinkCTA('xml', '10'), null);

  // Limiares de exibicao
  assert.equal(shouldShowCTA('xml', 0), false);
  assert.equal(shouldShowCTA('xml', 9), false);
  assert.equal(buildCTAHtml('xml', 0), '');
  assert.equal(buildCTAHtml('xml', 9), '');
  assert.equal(shouldShowCTA('xml', 10), true);

  const xmlHtml = buildCTAHtml('xml', 10);
  assert.ok(xmlHtml.includes('R$ 250 por lote'));
  assert.ok(xmlHtml.includes('href="servicos.html"'));
  assert.ok(xmlHtml.includes('href="pro.html"'));
  assert.ok(xmlHtml.includes('rel="noopener noreferrer"'));
  assert.ok(xmlHtml.includes('aria-label="Fechar convite de serviço"'));

  assert.equal(shouldShowCTA('conciliador', 0), false);
  assert.equal(shouldShowCTA('conciliador', 1), true);
  assert.ok(buildCTAHtml('conciliador', 1).includes('R$ 350/mês'));

  assert.equal(shouldShowCTA('organizador', 0), false);
  assert.equal(shouldShowCTA('organizador', 1), true);
  assert.ok(buildCTAHtml('organizador', 1).includes('R$ 400 por projeto'));

  // Dispensa em memoria (sem localStorage)
  dismissCTA('xml');
  assert.equal(shouldShowCTA('xml', 25), false);
  assert.equal(buildCTAHtml('xml', 25), '');
  resetCTADismissals();
  assert.equal(shouldShowCTA('xml', 25), true);

  // Garante que js/cta.js nao usa localStorage nem fetch/rede
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const ctaSource = fs.readFileSync(path.join(rootDir, 'js/cta.js'), 'utf8');
  assert.equal(/localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest/i.test(ctaSource), false);
});
