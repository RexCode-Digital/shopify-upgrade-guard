import { parse, Kind, visit } from 'graphql';
// Parse only literal GraphQL documents. Dynamic templates remain unsupported.
export function rootFieldMatches(file, name, guidance, operation = 'query') {
  const documents = [];
  if (/\.(graphql|gql)$/.test(file.relativePath)) documents.push({ text: file.text, offset: 0 });
  else for (const match of file.text.matchAll(/([`"'])([\s\S]*?)\1/g)) {
    const text = match[2];
    if (text.includes('${') || !/(?:\bquery\b|\bmutation\b|#graphql|^\s*\{)/.test(text)) continue;
    documents.push({ text, offset: match.index + 1 });
  }
  const matches = [];
  for (const doc of documents) {
    try {
      const ast = parse(doc.text, { maxTokens: 50000 });
      const fragments = new Map(ast.definitions.filter(d => d.kind === Kind.FRAGMENT_DEFINITION).map(d => [d.name.value,d]));
      let visits = 0;
      const visitRoot = (selections, stack = []) => {
        for (const node of selections ?? []) {
          if (++visits > 50000) throw new Error('GraphQL expansion limit');
          if (node.kind === Kind.FIELD && node.name.value === name) {
            const index = doc.offset + node.name.loc.start;
            const before = file.text.slice(0,index);
            matches.push({ file: file.relativePath, line: before.split('\n').length, column: index - before.lastIndexOf('\n'), snippet: name, guidance });
          } else if (node.kind === Kind.INLINE_FRAGMENT) visitRoot(node.selectionSet.selections, stack);
          else if (node.kind === Kind.FRAGMENT_SPREAD && fragments.has(node.name.value) && !stack.includes(node.name.value)) visitRoot(fragments.get(node.name.value).selectionSet.selections,[...stack,node.name.value]);
        }
      };
      for (const definition of ast.definitions.filter(d=>d.kind===Kind.OPERATION_DEFINITION && d.operation === operation)) visitRoot(definition.selectionSet.selections);
    } catch { /* Unsupported or malformed documents are not evidence of this removal. */ }
  }
  return matches;
}

// Match enum values only when they are literal inputs to the named mutation.
// Runtime variables and dynamically assembled documents remain outside this evidence.
export function mutationEnumMatches(file, mutationNames, argumentName, objectPath, enumValues, guidance) {
  const documents = literalDocuments(file);
  const matches = [];
  for (const doc of documents) try {
    const ast = parse(doc.text, { maxTokens: 50000 });
    const fragments = new Map(ast.definitions.filter(d => d.kind === Kind.FRAGMENT_DEFINITION).map(d => [d.name.value, d]));
    let visits = 0;
    const findValue = (value) => {
      let current = value;
      for (const fieldName of objectPath) {
        if (current?.kind !== Kind.OBJECT) return null;
        current = current.fields.find(field => field.name.value === fieldName)?.value;
      }
      return current;
    };
    const visitRoot = (selections, stack = []) => {
      for (const node of selections ?? []) {
        if (++visits > 50000) throw new Error('GraphQL expansion limit');
        if (node.kind === Kind.FIELD) {
          if (!mutationNames.includes(node.name.value)) continue;
          const argument = node.arguments?.find(item => item.name.value === argumentName);
          const value = findValue(argument?.value);
          if (value?.kind === Kind.ENUM && enumValues.includes(value.value)) {
            const index = doc.offset + value.loc.start, before = file.text.slice(0, index);
            matches.push({ file: file.relativePath, line: before.split('\n').length, column: index - before.lastIndexOf('\n'), snippet: value.value, guidance });
          }
        } else if (node.kind === Kind.INLINE_FRAGMENT) visitRoot(node.selectionSet.selections, stack);
        else if (node.kind === Kind.FRAGMENT_SPREAD && fragments.has(node.name.value) && !stack.includes(node.name.value)) visitRoot(fragments.get(node.name.value).selectionSet.selections, [...stack, node.name.value]);
      }
    };
    for (const definition of ast.definitions.filter(d => d.kind === Kind.OPERATION_DEFINITION && d.operation === 'mutation')) visitRoot(definition.selectionSet.selections);
  } catch { /* Malformed or dynamic documents cannot establish a literal mutation input. */ }
  return matches;
}

// Existing field/type removals require a parseable literal document too.
export function fieldMatches(file, fields, types, guidance) {
  const documents = [];
  if (/\.(graphql|gql)$/.test(file.relativePath)) documents.push({ text: file.text, offset: 0 });
  else for (const match of file.text.matchAll(/([`"'])([\s\S]*?)\1/g)) {
    if (!match[2].includes('${') && /(?:\bquery\b|\bmutation\b|#graphql|^\s*\{)/.test(match[2])) documents.push({ text: match[2], offset: match.index + 1 });
  }
  const matches = [];
  for (const doc of documents) try {
    const ast = parse(doc.text, { maxTokens: 50000 });
    visit(ast, { enter(node) {
      const name = node.kind === Kind.FIELD && fields.includes(node.name.value) ? node.name : ([Kind.INLINE_FRAGMENT, Kind.FRAGMENT_DEFINITION].includes(node.kind) && types.includes(node.typeCondition?.name.value) ? node.typeCondition.name : null);
      if (!name) return;
      const index = doc.offset + name.loc.start, before = file.text.slice(0,index);
      matches.push({ file: file.relativePath, line: before.split('\n').length, column: index - before.lastIndexOf('\n'), snippet: name.value, guidance });
    } });
  } catch { /* Malformed/dynamic documents cannot establish schema usage. */ }
  return matches;
}

export function namedTypeMatches(file, types, guidance) {
  const matches = [];
  for (const doc of literalDocuments(file)) try {
    const ast = parse(doc.text, { maxTokens: 50000 });
    visit(ast, { NamedType(node) {
      if (!types.includes(node.name.value)) return;
      const index = doc.offset + node.name.loc.start, before = file.text.slice(0, index);
      matches.push({ file: file.relativePath, line: before.split('\n').length, column: index - before.lastIndexOf('\n'), snippet: node.name.value, guidance });
    } });
  } catch { /* Malformed or dynamic documents cannot establish a literal type reference. */ }
  return matches;
}

export function productVariantBarcodeMatches(file, guidance) {
  const documents = literalDocuments(file);
  const matches = [];
  for (const doc of documents) try {
    const ast = parse(doc.text, { maxTokens: 50000 });
    const fragments = new Map(ast.definitions.filter(d => d.kind === Kind.FRAGMENT_DEFINITION).map(d => [d.name.value, d]));
    const add = (node) => {
      const index = doc.offset + node.name.loc.start, before = file.text.slice(0, index);
      matches.push({ file: file.relativePath, line: before.split('\n').length, column: index - before.lastIndexOf('\n'), snippet: node.name.value, guidance });
    };
    const walkVariant = (selections, stack = []) => {
      for (const node of selections ?? []) {
        if (node.kind === Kind.FIELD && node.name.value === 'barcode') add(node);
        else if (node.kind === Kind.INLINE_FRAGMENT) walkVariant(node.selectionSet.selections, stack);
        else if (node.kind === Kind.FRAGMENT_SPREAD && fragments.has(node.name.value) && !stack.includes(node.name.value)) {
          const fragment = fragments.get(node.name.value);
          if (fragment.typeCondition.name.value === 'ProductVariant') walkVariant(fragment.selectionSet.selections, [...stack, node.name.value]);
        }
      }
    };
    const walkRoot = (selections, stack = []) => {
      for (const node of selections ?? []) {
        if (node.kind === Kind.FIELD && node.name.value === 'productVariant') walkVariant(node.selectionSet?.selections);
        else if (node.kind === Kind.FIELD && node.name.value === 'productVariants') {
          for (const connection of node.selectionSet?.selections ?? []) {
            if (connection.kind !== Kind.FIELD || !['nodes', 'edges'].includes(connection.name.value)) continue;
            const variants = connection.name.value === 'nodes' ? connection.selectionSet?.selections : connection.selectionSet?.selections?.filter(edge => edge.kind === Kind.FIELD && edge.name.value === 'node').flatMap(edge => edge.selectionSet?.selections ?? []);
            walkVariant(variants);
          }
        } else if (node.kind === Kind.INLINE_FRAGMENT) walkRoot(node.selectionSet.selections, stack);
        else if (node.kind === Kind.FRAGMENT_SPREAD && fragments.has(node.name.value) && !stack.includes(node.name.value)) {
          const fragment = fragments.get(node.name.value);
          if (fragment.typeCondition.name.value === 'QueryRoot') walkRoot(fragment.selectionSet.selections, [...stack, node.name.value]);
        }
      }
    };
    for (const definition of ast.definitions) {
      if (definition.kind === Kind.OPERATION_DEFINITION && definition.operation === 'query') walkRoot(definition.selectionSet.selections);
      if (definition.kind === Kind.FRAGMENT_DEFINITION && definition.typeCondition.name.value === 'ProductVariant') walkVariant(definition.selectionSet.selections, [definition.name.value]);
    }
  } catch { /* Malformed or dynamic documents cannot establish a ProductVariant field use. */ }
  return matches;
}

export function segmentQueryMatches(file, guidance) {
  const pattern = /(?:\b[a-z][\w.]*(?:\([^)]*\))?\s*=\s*(?:true|false)\b|\b(?:12_months_ago|90_days_ago|30_days_ago|7_days_ago)\b)/gi;
  const documents = literalDocuments(file);
  const matches = [];
  for (const doc of documents) try {
    const ast = parse(doc.text, { maxTokens: 50000 });
    visit(ast, { Field(node) {
      if (!/^segments?(?:Create|Update|Upsert|Delete)?$/i.test(node.name.value)) return;
      const inspect = (value) => {
        if (!value) return;
        if (value.kind === Kind.OBJECT) for (const field of value.fields) {
          if (field.name.value === 'query' && field.value.kind === Kind.STRING) {
            const legacy = [...field.value.value.matchAll(pattern)];
            for (const match of legacy) {
              const index = doc.offset + field.value.loc.start + match.index;
              const before = file.text.slice(0, index);
              matches.push({ file: file.relativePath, line: before.split('\n').length, column: index - before.lastIndexOf('\n'), snippet: match[0], guidance });
            }
          } else inspect(field.value);
        }
        else if (value.kind === Kind.LIST) value.values.forEach(inspect);
      };
      for (const arg of node.arguments ?? []) {
        if (arg.name.value === 'query' && arg.value.kind === Kind.STRING) {
          const legacy = [...arg.value.value.matchAll(pattern)];
          for (const match of legacy) {
            const index = doc.offset + arg.value.loc.start + match.index, before = file.text.slice(0, index);
            matches.push({ file: file.relativePath, line: before.split('\n').length, column: index - before.lastIndexOf('\n'), snippet: match[0], guidance });
          }
        } else inspect(arg.value);
      }
    } });
  } catch { /* Malformed or dynamic documents are not evidence. */ }
  return matches;
}

function literalDocuments(file) {
  if (/\.(graphql|gql)$/.test(file.relativePath)) return [{ text: file.text, offset: 0 }];
  if (!/\.(?:[jt]sx?)$/.test(file.relativePath)) return [];
  return [...file.text.matchAll(/([`"'])([\s\S]*?)\1/g)].flatMap(match => {
    const text = match[2];
    return !text.includes('${') && /(?:\bquery\b|\bmutation\b|#graphql|^\s*\{)/.test(text) ? [{ text, offset: match.index + 1 }] : [];
  });
}
