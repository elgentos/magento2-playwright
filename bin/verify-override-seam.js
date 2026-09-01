#!/usr/bin/env node
/**
 * Verifies the POM override seam.
 *
 * A store's tests/poms/<x>.page.ts must shadow the packaged base-tests/poms/<x>.page.ts
 * and be the class specs actually receive, while still being able to extend the base
 * implementation through the @base/* alias.
 *
 * This cannot be tested from inside the suite: in this repo base-tests/ is a generated
 * copy of tests/, so the two layers never differ. Instead we build a throwaway
 * consumer-shaped project in a temp dir where they do.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');

// Renamed in Task 3. Keep every class name the harness needs in this one block.
const POM_CLASS = 'LoginPage';
const POM_MODULE = 'poms/frontend/login.page';
const CHECKOUT_CLASS = 'CheckoutPage';
const CHECKOUT_MODULE = 'poms/frontend/checkout.page';
const MAINMENU_CLASS = 'MainMenuPage';
const MAINMENU_MODULE = 'poms/frontend/mainmenu.page';

const SENTINEL = '#seam-override-marker';
// Distinct from SENTINEL so a false-positive match between the two checks is
// not possible.
const COMPOSE_SENTINEL = '#seam-compose-marker';
const LAYER_DIRS = ['poms', 'utils', 'config', 'types'];

/**
 * The base layer to copy. In local development tests/ is authoritative. In CI,
 * build.js has already deleted tests/ (it does that when CI=true), so base-tests/
 * is all that remains — and it is the layer a consumer receives anyway.
 */
function baseLayerSource() {
  for (const candidate of ['tests', 'base-tests']) {
    if (fs.existsSync(path.join(REPO, candidate, 'poms'))) {
      return path.join(REPO, candidate);
    }
  }
  throw new Error('Neither tests/poms nor base-tests/poms exists — run `node build.js` first.');
}

/** tsconfig.example.json is JSONC: strip // comments and trailing commas. */
function readShippedCompilerOptions() {
  const raw = fs.readFileSync(path.join(REPO, 'tsconfig.example.json'), 'utf-8');
  const stripped = raw.replace(/\/\/[^\n]*/g, '').replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(stripped).compilerOptions;
}

/**
 * The real login page title from config, used to build a SEAM_PROTECTED value
 * that only the actual protected getter (not an arbitrary getByRole call) can
 * produce. See the `checks` comment in main() for why.
 */
function readLoginTitle(source) {
  const raw = fs.readFileSync(path.join(source, 'config', 'element-identifiers.json'), 'utf-8');
  return JSON.parse(raw).text.frontend.login.title;
}

function buildFixture(dir, source) {
  for (const layer of LAYER_DIRS) {
    const from = path.join(source, layer);
    if (fs.existsSync(from)) {
      fs.cpSync(from, path.join(dir, 'base-tests', layer), { recursive: true });
    }
  }

  // Reuse the repo's installed dependencies rather than installing again.
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'), 'dir');

  // base-tests/utils/global-setup.ts imports this via a relative ../../ path,
  // mirroring the real repo layout (playwrightRequestConfig.ts lives at the
  // project root, two levels above tests/utils/). Not part of the seam under
  // test, but required for the fixture to type-check.
  fs.copyFileSync(
    path.join(REPO, 'playwrightRequestConfig.ts'),
    path.join(dir, 'playwrightRequestConfig.ts'),
  );

  // playwrightRequestConfig.ts imports './tests/utils/env.utils' by a hardcoded
  // relative path (not an alias), so the fixture needs a tests/utils/ mirror
  // too. This does NOT model a real consumer's tests/ — build.js:96 creates a
  // real consumer's tests/ directory empty via mkdirSync. The mirror exists
  // purely so the hardcoded relative-import chain (global-setup.ts ->
  // ../../playwrightRequestConfig -> ./tests/utils/env.utils) has something to
  // resolve against for type-checking.
  const utilsSource = path.join(source, 'utils');
  if (fs.existsSync(utilsSource)) {
    fs.cpSync(utilsSource, path.join(dir, 'tests', 'utils'), { recursive: true });
  }

  // Aliases come from the SHIPPED template, so a missing @base/* fails this test.
  fs.writeFileSync(
    path.join(dir, 'tsconfig.json'),
    JSON.stringify({ compilerOptions: readShippedCompilerOptions() }, null, 2) + '\n',
  );

  fs.writeFileSync(
    path.join(dir, 'playwright.config.ts'),
    'export default { testDir: ".", timeout: 5000 };\n',
  );

  // The store override: shadows the base file, extends it via @base.
  fs.mkdirSync(path.join(dir, 'tests', 'poms', 'frontend'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'tests', POM_MODULE + '.ts'),
    [
      `import { ${POM_CLASS} as Parent } from '@base/${POM_MODULE}';`,
      ``,
      `export class ${POM_CLASS} extends Parent {`,
      `\t// override one getter, keeping the rest via super`,
      `\tget loginFormFields() {`,
      `\t\treturn { ...super.loginFormFields, emailField: this.page.locator('${SENTINEL}') };`,
      `\t}`,
      ``,
      `\t// prove a protected member is reachable from a subclass`,
      `\tget seamProbeTitle() {`,
      `\t\treturn this.loginPageTitle;`,
      `\t}`,
      `}`,
      ``,
    ].join('\n'),
  );

  // A second store override, of the POM the first one composes internally.
  // Proves cross-POM composition: LoginPage.login() does `new MainMenuPage(this.page)`
  // via @poms/*, and that must resolve to THIS file, not the packaged base class.
  // The sentinel lives in the constructor (rather than a getter) so it fires the
  // moment login() constructs the instance, with no dependency on a real Page.
  fs.writeFileSync(
    path.join(dir, 'tests', MAINMENU_MODULE + '.ts'),
    [
      `import { ${MAINMENU_CLASS} as Parent } from '@base/${MAINMENU_MODULE}';`,
      `import type { Page } from '@playwright/test';`,
      ``,
      `export class ${MAINMENU_CLASS} extends Parent {`,
      `\tconstructor(page: Page) {`,
      `\t\tsuper(page);`,
      `\t\tconsole.log('SEAM_COMPOSE=${COMPOSE_SENTINEL}');`,
      `\t}`,
      `}`,
      ``,
    ].join('\n'),
  );

  fs.writeFileSync(
    path.join(dir, 'tests', 'seam.spec.ts'),
    [
      `import { test } from '@playwright/test';`,
      `import { ${POM_CLASS} } from '@poms/${POM_MODULE.replace('poms/', '')}';`,
      ``,
      `const stub: any = {`,
      `\tlocator: (selector: string) => ({ selector }),`,
      `\tgetByRole: (role: string, opts?: any) => ({ selector: 'role:' + role + ':' + (opts && opts.name || '') }),`,
      `\tgetByLabel: () => ({ selector: 'label' }),`,
      `\ton: () => {},`,
      `};`,
      ``,
      `const pom = new ${POM_CLASS}(stub);`,
      `console.log('SEAM_EMAIL=' + (pom.loginFormFields.emailField as any).selector);`,
      `console.log('SEAM_PROTECTED=' + (pom as any).seamProbeTitle.selector);`,
      ``,
      `// login() is inherited (not overridden) on this subclass. Its first statement,`,
      `// \`new ${MAINMENU_CLASS}(this.page)\`, runs synchronously and fires the sentinel`,
      `// above before the rest of the method fails against this minimal stub.`,
      `pom.login('seam@example.test', 'irrelevant').catch(() => {});`,
      ``,
      `test('seam placeholder', () => {});`,
      ``,
    ].join('\n'),
  );

  // Proves the members a store needs to customise are reachable from a subclass.
  // Compiles only while submitOrder and the MagewireUtils internals are protected.
  fs.writeFileSync(
    path.join(dir, 'tests', CHECKOUT_MODULE + '.ts'),
    [
      `import { ${CHECKOUT_CLASS} as Parent } from '@base/${CHECKOUT_MODULE}';`,
      ``,
      `export class ${CHECKOUT_CLASS} extends Parent {`,
      `\tprotected async submitOrder(attempts: number = 3) {`,
      `\t\tawait super.submitOrder(attempts);`,
      `\t}`,
      ``,
      `\tasync seamProbeMagewire() {`,
      `\t\treturn this.isMagewireRequest('https://example.test/magewire/message');`,
      `\t}`,
      `}`,
      ``,
    ].join('\n'),
  );
}

function run(dir, args) {
  return execFileSync('npx', args, { cwd: dir, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seam-'));
  try {
    const source = baseLayerSource();
    const loginTitle = readLoginTitle(source);
    buildFixture(dir, source);

    try {
      run(dir, ['tsc', '--noEmit', '-p', 'tsconfig.json']);
    } catch (err) {
      throw new Error('type check failed in fixture:\n' + (err.stdout || '') + (err.stderr || ''));
    }

    let output;
    try {
      output = run(dir, ['playwright', 'test', '--list']);
    } catch (err) {
      throw new Error('playwright --list failed in fixture:\n' + (err.stdout || '') + (err.stderr || ''));
    }

    const checks = [
      [`SEAM_EMAIL=${SENTINEL}`, 'store override did not shadow the base POM'],
      // Checks the exact role+name the real protected getter builds from config,
      // not just that some getByRole call happened — a bare 'role' sentinel would
      // pass for any getByRole call and would not actually prove the protected
      // member was reached.
      [`SEAM_PROTECTED=role:heading:${loginTitle}`, 'protected member was not reachable, or super getter was lost'],
      [`SEAM_COMPOSE=${COMPOSE_SENTINEL}`, 'cross-POM composition did not pick up the store override of the composed POM'],
    ];

    for (const [needle, message] of checks) {
      if (!output.includes(needle)) {
        throw new Error(`${message}\nexpected to find: ${needle}\n--- output ---\n${output}`);
      }
    }

    console.log('PASS: store override shadows the base POM, can extend it, and is picked up when composed by another base POM');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

main();
