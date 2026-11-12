import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const playgroundDirectory = fileURLToPath(new URL('../web-codegen-scorer-playground/', import.meta.url));
const cliPath = join(playgroundDirectory, 'node_modules/web-codegen-scorer/runner/bin/cli.js');
const scorerFileSystemUrl = pathToFileURL(
  join(playgroundDirectory, 'node_modules/web-codegen-scorer/runner/file-system-utils.js')
).href;
const windowsFileSystemUrl = new URL('./scorer-windows-fs.mjs', import.meta.url).href;

if (!existsSync(cliPath)) {
  console.error('Install the evaluation dependencies first: npm --prefix web-codegen-scorer-playground install');
  process.exit(1);
}

// Scorer 0.0.69 imports absolute Windows paths without converting them to file URLs.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      process.platform === 'win32' &&
      context.parentURL === scorerFileSystemUrl &&
      (specifier === 'fs/promises' || specifier === 'node:fs/promises')
    ) {
      return nextResolve(windowsFileSystemUrl, context);
    }
    const normalized =
      process.platform === 'win32' && /^[a-z]:[\\/]/i.test(specifier) ? pathToFileURL(specifier).href : specifier;
    return nextResolve(normalized, context);
  }
});

const extraArguments = process.argv.slice(2);
process.chdir(playgroundDirectory);
process.argv = [
  process.execPath,
  cliPath,
  'eval',
  '--env=./config.mjs',
  '--model=gpt-5.1-no-thinking',
  '--prompt-filter=goal-tracker',
  ...extraArguments
];

await import(pathToFileURL(cliPath).href);
