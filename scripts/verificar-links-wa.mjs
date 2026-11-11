import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NEGOCIO, buildWhatsappLink } from '../js/negocio.js';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function listHtmlFiles(dir = ROOT_DIR) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results.sort();
}

export function inspectWhatsappLinks(rootDir = ROOT_DIR, expectedPhone = NEGOCIO.whatsapp) {
  const htmlFiles = listHtmlFiles(rootDir);
  const links = [];
  const errors = [];
  const waHrefRegex = /href=["'](https:\/\/wa\.me\/[^"']+)["']/gi;

  for (const filePath of htmlFiles) {
    const relFile = path.relative(rootDir, filePath).replace(/\\/g, '/');
    const html = fs.readFileSync(filePath, 'utf8');

    for (const match of html.matchAll(waHrefRegex)) {
      const url = match[1];
      const parsed = /^https:\/\/wa\.me\/(\d+)(?:\?text=(.+))?$/.exec(url);
      if (!parsed) {
        errors.push(`${relFile}: URL wa.me em formato inválido (${url})`);
        continue;
      }
      const [, phone, rawText] = parsed;
      if (phone !== expectedPhone) {
        errors.push(`${relFile}: número divergente de NEGOCIO.whatsapp (${phone} !== ${expectedPhone})`);
      }
      if (!rawText) {
        errors.push(`${relFile}: link wa.me sem parâmetro ?text= (${url})`);
        continue;
      }
      let decodedText = '';
      try {
        decodedText = decodeURIComponent(rawText);
      } catch {
        errors.push(`${relFile}: parâmetro ?text= com codificação inválida (${url})`);
        continue;
      }
      if (!/Vim pel[oa]\s+.+/i.test(decodedText) || !/AutoContábil Hub/i.test(decodedText)) {
        errors.push(`${relFile}: mensagem do WhatsApp não identifica a origem (${decodedText})`);
      }
      links.push({ file: relFile, phone, url, text: decodedText });
    }

    const anchorTagRegex = /<a\b[^>]*\bdata-wa-origem=["']([^"']+)["'][^>]*>/gi;
    for (const tagMatch of html.matchAll(anchorTagRegex)) {
      const tag = tagMatch[0];
      const origem = tagMatch[1];
      const servicoMatch = /\bdata-wa-servico=["']([^"']+)["']/i.exec(tag);
      const hrefMatch = /\bhref=["']([^"']+)["']/i.exec(tag);
      const servico = servicoMatch ? servicoMatch[1] : undefined;
      const actualHref = hrefMatch ? hrefMatch[1] : '';
      const expectedHref = buildWhatsappLink({ origem, servico }, expectedPhone);
      if (actualHref !== expectedHref) {
        errors.push(
          `${relFile}: elemento data-wa-origem="${origem}" tem href estático divergente de buildWhatsappLink.\n  Esperado: ${expectedHref}\n  Atual:    ${actualHref}`
        );
      }
    }
  }

  return { links, errors };
}

export function syncWhatsappPhoneInHtml(rootDir = ROOT_DIR, newPhone = NEGOCIO.whatsapp) {
  const cleanPhone = String(newPhone || '').replace(/\D/g, '');
  if (!cleanPhone) throw new Error('Número de WhatsApp inválido em NEGOCIO.whatsapp');
  const htmlFiles = listHtmlFiles(rootDir);
  let updatedFiles = 0;

  for (const filePath of htmlFiles) {
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = original.replace(/https:\/\/wa\.me\/\d+(\?text=[^"'\s>]+)/g, `https://wa.me/${cleanPhone}$1`);
    if (updated !== original) {
      fs.writeFileSync(filePath, updated, 'utf8');
      updatedFiles++;
    }
  }
  return updatedFiles;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  if (process.argv.includes('--atualizar')) {
    const count = syncWhatsappPhoneInHtml(ROOT_DIR, NEGOCIO.whatsapp);
    console.log(`Número atualizado para ${NEGOCIO.whatsapp} em ${count} arquivo(s) HTML.`);
  }
  const { links, errors } = inspectWhatsappLinks(ROOT_DIR, NEGOCIO.whatsapp);
  console.log(`Verificados ${links.length} links wa.me nos arquivos HTML (número oficial: ${NEGOCIO.whatsapp}).`);
  if (errors.length > 0) {
    console.error('Erros encontrados nos links de WhatsApp:');
    for (const err of errors) {
      console.error(` - ${err}`);
    }
    process.exit(1);
  }
  console.log('Todos os links wa.me usam NEGOCIO.whatsapp e identificam a origem.');
}
