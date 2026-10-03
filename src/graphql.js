import { parse, Kind } from 'graphql';
// Parse only literal GraphQL documents. Dynamic templates remain unsupported.
export function rootFieldMatches(file, name, guidance) {
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
      for (const operation of ast.definitions.filter(d=>d.kind===Kind.OPERATION_DEFINITION && d.operation === 'query')) visitRoot(operation.selectionSet.selections);
    } catch { /* Unsupported or malformed documents are not evidence of this removal. */ }
  }
  return matches;
}
