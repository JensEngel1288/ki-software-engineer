const fs = require('node:fs');
const path = require('node:path');

function preparePages(outputDirectory, basePath) {
  if (typeof basePath !== 'string') {
    throw new Error('PAGES_BASE_PATH must be set by Configure Pages; an empty string is valid for a root site.');
  }
  if (basePath && (!basePath.startsWith('/') || basePath.startsWith('//'))) {
    throw new Error('PAGES_BASE_PATH must be a site path, not a URL.');
  }

  const baseHref = basePath.replace(/\/+$/, '') + '/';
  const escapedHref = baseHref.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const indexPath = path.join(outputDirectory, 'index.html');
  const html = fs.readFileSync(indexPath, 'utf8');
  const baseTag = /(<base\b[^>]*\bhref\s*=\s*)(["'])(.*?)\2/i;
  if (!baseTag.test(html)) throw new Error('The built index.html has no base href to prepare for Pages.');

  const prepared = html.replace(baseTag, (_, prefix) => prefix + '"' + escapedHref + '"');
  fs.writeFileSync(indexPath, prepared);
  fs.writeFileSync(path.join(outputDirectory, '404.html'), prepared);
  return baseHref;
}

if (require.main === module) {
  const directory = path.resolve('dist/angular-workshop-modern/browser');
  const baseHref = preparePages(directory, process.env.PAGES_BASE_PATH);
  console.log('Prepared Pages index and Angular route fallback for ' + baseHref);
}

module.exports = { preparePages };
