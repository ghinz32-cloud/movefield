import assert from 'node:assert/strict';
import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {dirname, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ESLint, Linter} from 'eslint';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const files = ['lib', 'components', 'mobile', 'mobile/src', 'mobile/src/shared']
  .flatMap(dir => readdirSync(dir, {withFileTypes: true})
    .filter(entry => entry.isFile() && entry.name.endsWith('runtime.js'))
    .map(entry => resolve(dir, entry.name)))
  .sort();
assert(files.length > 0, 'Runtime implementations must be included in the audit.');

// Next's TypeScript preset disables no-undef even for the recovered JS files.
// Their adjacent declarations cannot catch an undefined name in the executed body.
const baseConfig = await new ESLint().calculateConfigForFile('lib/training-runtime.js');
const lintConfig = {
  languageOptions: {ecmaVersion: 'latest', sourceType: 'module', globals: baseConfig.languageOptions.globals},
  rules: Object.fromEntries([
    'no-undef', 'no-dupe-args', 'no-dupe-else-if', 'no-dupe-keys',
    'no-unreachable', 'no-unsafe-optional-chaining', 'no-constant-binary-expression',
  ].map(rule => [rule, 'error'])),
};
const linter = new Linter();
assert(linter.verify('function PlanSetup({ state }) { return sourceChoice?.id ?? state.id; }', lintConfig)
  .some(message => message.ruleId === 'no-undef' && message.message.includes('sourceChoice')),
'The gate must catch the previously missed PlanSetup crash.');

const configFile = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
const contracts = files.map(file => file.replace(/\.js$/, '.d.ts'));
const program = ts.createProgram([...files, ...contracts.filter(existsSync), resolve('mobile/src/assets.d.ts')], {
  ...parsed.options, allowJs: true, checkJs: false, incremental: false, noEmit: true,
});
const checker = program.getTypeChecker();
const problems = [];
let importChecks = 0;
let namespaceChecks = 0;

function valueExports(symbol) {
  return checker.getExportsOfModule(symbol).filter(entry => {
    const target = entry.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(entry) : entry;
    return !!(target.flags & ts.SymbolFlags.Value);
  }).map(entry => entry.name).sort();
}

for (const file of files) {
  const sourceText = readFileSync(file, 'utf8');
  const display = relative(root, file);
  for (const message of linter.verify(sourceText, lintConfig)) {
    problems.push(`${display}:${message.line}:${message.column} ${message.ruleId}: ${message.message}`);
  }
  const source = program.getSourceFile(file);
  const contractFile = file.replace(/\.js$/, '.d.ts');
  if (!existsSync(contractFile)) {
    problems.push(`${display}: missing adjacent runtime contract`);
  } else {
    const actual = valueExports(checker.getSymbolAtLocation(source));
    const expected = valueExports(checker.getSymbolAtLocation(program.getSourceFile(contractFile)));
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      problems.push(`${display}: runtime/contract export mismatch; missing ${expected.filter(x => !actual.includes(x))}; undeclared ${actual.filter(x => !expected.includes(x))}`);
    }
  }

  const namespaces = new Map();
  for (const node of source.statements) {
    if (!ts.isImportDeclaration(node)) continue;
    const path = node.moduleSpecifier.text;
    if (!path.startsWith('.') && !path.startsWith('@/')) continue;
    importChecks += 1;
    if (/\.(jpg|png|ttf)$/.test(path)) {
      if (!existsSync(resolve(dirname(file), path))) problems.push(`${display}: missing imported asset ${path}`);
      continue;
    }
    const symbol = checker.getSymbolAtLocation(node.moduleSpecifier);
    if (!symbol) {
      problems.push(`${display}: unresolved import ${path}`);
      continue;
    }
    const names = valueExports(symbol);
    const bindings = node.importClause?.namedBindings;
    if (bindings && ts.isNamespaceImport(bindings)) namespaces.set(bindings.name.text, {path, names});
    if (bindings && ts.isNamedImports(bindings)) {
      for (const item of bindings.elements) {
        const name = (item.propertyName || item.name).text;
        if (!names.includes(name)) problems.push(`${display}: ${path} does not export imported value ${name}`);
      }
    }
  }

  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)
      && node.initializer && ts.isIdentifier(node.initializer) && namespaces.has(node.initializer.text)) {
      // In a cyclic optimized bundle this eager copy can capture an uninitialized
      // namespace object. Preserve ESM's live bindings with a direct namespace import.
      problems.push(`${display}: eager namespace alias ${node.name.text}; import the namespace directly`);
    }
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && namespaces.has(node.expression.text)) {
      const imported = namespaces.get(node.expression.text);
      namespaceChecks += 1;
      // JSON module namespaces intentionally expose their JSON value as default.
      if (!imported.names.includes(node.name.text) && !(imported.path.endsWith('.json') && node.name.text === 'default')) {
        problems.push(`${display}: ${imported.path} does not export ${node.name.text}`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Runtime boundaries PASS: ${files.length} implementations and contracts, ${importChecks} local imports, ${namespaceChecks} namespace accesses, undefined-name regression canary.`);
}
