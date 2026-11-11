import test from 'node:test';
import assert from 'node:assert/strict';

import { parseMoney, parseDateAny, csvCell, splitCSV, dayDiff } from '../js/utils.js';
import { reconcile, parseOFX, parseTxCSV } from '../js/conciliadorModule.js';
import { calcDV, buildDemoXML, parseNFe } from '../js/xmlModule.js';
import { guessMeta, buildName } from '../js/organizadorModule.js';
import { isContactConfigured, isContactEmailConfigured, isContactEndpointConfigured, buildContactAlternativesHtml } from '../js/contactModule.js';

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
});
