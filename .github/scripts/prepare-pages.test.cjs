const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { preparePages } = require('./prepare-pages.cjs');

const original = '<html><head><base href="/"><script src="main.js"></script></head></html>';

function site(t, html = original) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bookmonkey-pages-'));
  fs.writeFileSync(path.join(directory, 'index.html'), html);
  t.after(() => {
    for (const file of fs.readdirSync(directory)) fs.unlinkSync(path.join(directory, file));
    fs.rmdirSync(directory);
  });
  return directory;
}

test('a project site gets its base path and an identical route fallback', t => {
  const directory = site(t);
  assert.equal(preparePages(directory, '/bookmonkey'), '/bookmonkey/');
  const index = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
  assert(index.includes('<base href="/bookmonkey/">'));
  assert(index.includes('<script src="main.js"></script>'));
  assert.equal(fs.readFileSync(path.join(directory, '404.html'), 'utf8'), index);
});

test('a root or custom-domain site keeps a root base', t => {
  const directory = site(t);
  assert.equal(preparePages(directory, ''), '/');
  assert.equal(fs.readFileSync(path.join(directory, 'index.html'), 'utf8'), original);
});

test('repeated preparation normalises trailing slashes without duplicate base tags', t => {
  const directory = site(t);
  preparePages(directory, '/books///');
  preparePages(directory, '/books/');
  const index = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
  assert(index.includes('<base href="/books/">'));
  assert.equal((index.match(/<base/g) || []).length, 1);
});

test('base attribute quoting and other attributes are preserved safely', t => {
  const directory = site(t, "<head><base target='_self' href = '/old/'></head>");
  preparePages(directory, '/books');
  assert.equal(
    fs.readFileSync(path.join(directory, 'index.html'), 'utf8'),
    '<head><base target=\'_self\' href = "/books/"></head>'
  );
});

test('the path is escaped when placed in an HTML attribute', t => {
  const directory = site(t);
  preparePages(directory, '/books&"more');
  assert(fs.readFileSync(path.join(directory, 'index.html'), 'utf8').includes('/books&amp;&quot;more/'));
});

test('a missing Pages environment value is rejected before writing', t => {
  const directory = site(t);
  assert.throws(() => preparePages(directory, undefined), /PAGES_BASE_PATH must be set/);
  assert.equal(fs.readFileSync(path.join(directory, 'index.html'), 'utf8'), original);
  assert(!fs.existsSync(path.join(directory, '404.html')));
});

test('an invalid site URL is rejected before writing', t => {
  const directory = site(t);
  for (const value of ['https://example.com', '//example.com']) {
    assert.throws(() => preparePages(directory, value), /site path, not a URL/);
  }
  assert.equal(fs.readFileSync(path.join(directory, 'index.html'), 'utf8'), original);
});

test('missing base markup fails instead of publishing a broken route fallback', t => {
  const directory = site(t, '<html><head></head></html>');
  assert.throws(() => preparePages(directory, '/books'), /no base href/);
  assert(!fs.existsSync(path.join(directory, '404.html')));
});
