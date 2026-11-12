import { fileURLToPath } from 'node:url';

const playgroundUrl = new URL('../web-codegen-scorer-playground/', import.meta.url);
const cliUrl = new URL('node_modules/web-codegen-scorer/runner/bin/cli.js', playgroundUrl);
const extraArguments = process.argv.slice(2);
const hasPort = extraArguments.some(argument => argument === '--port' || argument.startsWith('--port='));

process.chdir(fileURLToPath(playgroundUrl));
process.argv = [
  process.execPath,
  fileURLToPath(cliUrl),
  'report',
  ...(hasPort ? [] : ['--port=4201']),
  ...extraArguments
];

await import(cliUrl.href);
