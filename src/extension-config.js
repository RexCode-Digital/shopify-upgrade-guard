import TOML from '@iarna/toml';

const EXTENSION_CONFIG = 'shopify.extension.toml';

export function missingOwnerTypeDeclarations(file) {
  if (file.relativePath.split('/').at(-1) !== EXTENSION_CONFIG) return [];

  let manifest;
  try {
    manifest = TOML.parse(file.text);
  } catch {
    throw new Error(`Malformed Shopify extension TOML in ${safePath(file.relativePath)}`);
  }

  if (!Array.isArray(manifest.extensions)) return [];
  const locations = locateMetafieldTables(file.text, file.relativePath);
  const findings = [];

  manifest.extensions.forEach((extension, extensionIndex) => {
    if (extension?.type !== 'ui_extension' || !Array.isArray(extension.targeting)) return;
    const surfaces = [...new Set(extension.targeting.map((target) => surfaceForTarget(target?.target)).filter(Boolean))];
    if (surfaces.length === 0) return;
    const globalSurface = surfaces.length === 1 ? surfaces[0] : 'ui_extension';

    const globalMetafields = Array.isArray(extension.metafields) ? extension.metafields : [];
    const globalLocations = locations.global.get(extensionIndex) ?? [];
    if (globalMetafields.length !== globalLocations.length) throw locationError(file.relativePath);
    globalMetafields.forEach((metafield, index) => {
      if (metafield.owner_type !== undefined) return;
      findings.push(asFinding(file, globalLocations[index], '[[extensions.metafields]]', globalSurface));
    });

    extension.targeting.forEach((target, targetingIndex) => {
      const surface = surfaceForTarget(target?.target);
      if (!surface) return;
      const metafields = Array.isArray(target.metafields) ? target.metafields : [];
      const targetLocations = locations.targeting.get(`${extensionIndex}:${targetingIndex}`) ?? [];
      if (metafields.length !== targetLocations.length) throw locationError(file.relativePath);
      metafields.forEach((metafield, index) => {
        if (metafield.owner_type !== undefined) return;
        findings.push(asFinding(file, targetLocations[index], '[[extensions.targeting.metafields]]', surface));
      });
    });
  });

  return findings;
}

function surfaceForTarget(target) {
  if (typeof target !== 'string') return null;
  if (target.startsWith('purchase.checkout.') || target.startsWith('purchase.thank-you.')) return 'checkout_ui_extension';
  if (target.startsWith('customer-account.')) return 'customer_account_ui_extension';
  return null;
}

function asFinding(file, location, snippet, surface) {
  if (!location) throw locationError(file.relativePath);
  return {
    file: file.relativePath,
    line: location.line,
    column: location.column,
    snippet,
    surface,
    guidance: 'Add the correct owner_type for the resource that owns this metafield. Upgrade Guard does not infer the owner type from the namespace or key.'
  };
}

function locateMetafieldTables(text, file) {
  const global = new Map();
  const targeting = new Map();
  let extensionIndex = -1;
  let targetingIndex = -1;
  const sourceLines = text.split(/\r?\n/);
  const maskedLines = maskTomlStringsAndComments(text).split(/\r?\n/);

  maskedLines.forEach((line, index) => {
    const path = arrayTablePath(sourceLines[index], line);
    if (isPath(path, ['extensions'])) {
      extensionIndex += 1;
      targetingIndex = -1;
    } else if (isPath(path, ['extensions', 'targeting'])) {
      targetingIndex += 1;
    } else if (isPath(path, ['extensions', 'metafields'])) {
      if (extensionIndex < 0) throw locationError(file);
      const entries = global.get(extensionIndex) ?? [];
      entries.push(sourceLocation(line, index));
      global.set(extensionIndex, entries);
    } else if (isPath(path, ['extensions', 'targeting', 'metafields'])) {
      if (extensionIndex < 0 || targetingIndex < 0) throw locationError(file);
      const key = `${extensionIndex}:${targetingIndex}`;
      const entries = targeting.get(key) ?? [];
      entries.push(sourceLocation(line, index));
      targeting.set(key, entries);
    }
  });

  return { global, targeting };
}

function sourceLocation(line, lineIndex) {
  return { line: lineIndex + 1, column: line.indexOf('[[') + 1 };
}

function arrayTablePath(sourceLine, maskedLine) {
  const maskedHeader = maskedLine.trim();
  if (!maskedHeader.startsWith('[[') || !maskedHeader.endsWith(']]')) return null;
  const start = maskedLine.indexOf('[[') + 2;
  const end = maskedLine.lastIndexOf(']]');
  return parseDottedKeyPath(sourceLine.slice(start, end));
}

function isPath(path, expected) {
  return Array.isArray(path) && path.length === expected.length && path.every((part, index) => part === expected[index]);
}

function parseDottedKeyPath(value) {
  const parts = [];
  let index = 0;
  while (index < value.length) {
    while (/\s/.test(value[index] ?? '')) index += 1;
    const quoteStart = index;
    const quote = value[index] === '"' || value[index] === "'" ? value[index++] : null;
    const start = index;
    if (quote) {
      while (index < value.length && value[index] !== quote) {
        if (value[index] === '\\' && quote === '"') index += 1;
        index += 1;
      }
      if (index >= value.length) return null;
      const rawKey = value.slice(quoteStart, index + 1);
      try { parts.push(TOML.parse(`key = ${rawKey}`).key); }
      catch { return null; }
      index += 1;
    } else {
      while (/[A-Za-z0-9_-]/.test(value[index] ?? '')) index += 1;
      if (index === start) return null;
      parts.push(value.slice(start, index));
    }
    while (/\s/.test(value[index] ?? '')) index += 1;
    if (index === value.length) break;
    if (value[index] !== '.') return null;
    index += 1;
  }
  return parts.length ? parts : null;
}

function maskTomlStringsAndComments(text) {
  const masked = text.split('');
  let state = 'plain';
  const blank = (index) => {
    if (text[index] !== '\n' && text[index] !== '\r') masked[index] = ' ';
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (state === 'comment') {
      if (character === '\n' || character === '\r') state = 'plain';
      else blank(index);
      continue;
    }

    if (state === 'basic') {
      blank(index);
      if (character === '\\' && index + 1 < text.length) { blank(index + 1); index += 1; }
      else if (character === '"') state = 'plain';
      continue;
    }
    if (state === 'literal') {
      blank(index);
      if (character === "'") state = 'plain';
      continue;
    }
    if (state === 'multiline-basic') {
      if (character === '"' && !isEscaped(text, index)) {
        const run = quoteRun(text, index, '"');
        if (run >= 3) {
          for (let cursor = index; cursor < index + run; cursor += 1) blank(cursor);
          index = index + run - 1;
          state = 'plain';
          continue;
        }
      }
      blank(index);
      if (character === '\\' && index + 1 < text.length) { blank(index + 1); index += 1; }
      continue;
    }
    if (state === 'multiline-literal') {
      if (character === "'") {
        const run = quoteRun(text, index, "'");
        if (run >= 3) {
          for (let cursor = index; cursor < index + run; cursor += 1) blank(cursor);
          index += run - 1;
          state = 'plain';
          continue;
        }
      }
      blank(index);
      continue;
    }

    if (character === '#') { blank(index); state = 'comment'; continue; }
    if (text.startsWith('"""', index)) {
      blank(index); blank(index + 1); blank(index + 2); index += 2; state = 'multiline-basic'; continue;
    }
    if (text.startsWith("'''", index)) {
      blank(index); blank(index + 1); blank(index + 2); index += 2; state = 'multiline-literal'; continue;
    }
    if (character === '"') { blank(index); state = 'basic'; continue; }
    if (character === "'") { blank(index); state = 'literal'; }
  }
  return masked.join('');
}

function quoteRun(text, start, quote) {
  let end = start;
  while (text[end] === quote) end += 1;
  return end - start;
}

function isEscaped(text, index) {
  let slashes = 0;
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === '\\'; cursor -= 1) slashes += 1;
  return slashes % 2 === 1;
}

function locationError(file) {
  return new Error(`Malformed Shopify extension TOML in ${safePath(file)}`);
}

function safePath(file) {
  return String(file).replace(/[\u0000-\u001f\u007f]/g, '?');
}
