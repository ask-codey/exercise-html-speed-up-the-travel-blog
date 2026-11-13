// Checks the travel blog's pictures: alt text, sizes, loading, srcset and the picture element.
// Run it with: npm test (run npm install once first). You don't need to change this file.
const nodeTest = require('node:test');

// Runs one check. When it fails, the output starts "Not yet:" and says what to fix, with no stack trace to scroll past.
function test(name, run) {
  return nodeTest(name, async (context) => {
    try {
      await run(context);
    } catch (error) {
      const problem = new Error(error.message);
      problem.stack = `Not yet: ${error.message}`;
      throw problem;
    }
  });
}
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { JSDOM } = require('jsdom');
const { HtmlValidate } = require('html-validate');

const html = readFileSync('index.html', 'utf8');
const page = new JSDOM(html).window.document;
const all = (selector) => [...page.querySelectorAll(selector)];

const name = (img) => img.getAttribute('src') || 'a picture';
const logo = () => page.querySelector('header a img');
const wave = () => all('img').find((img) => (img.getAttribute('src') || '').includes('wave'));
const hero = () => page.querySelector('main img');
const photos = () => all('figure img');

// Every address in a srcset: "images/a-480.jpg 480w, images/a-960.jpg 960w" gives the two addresses.
const candidates = (srcset) =>
  (srcset || '').split(',').map((entry) => entry.trim()).filter(Boolean).map((entry) => entry.split(/\s+/));

test('1) every picture has an alt attribute', () => {
  for (const img of all('img')) {
    assert.ok(img.hasAttribute('alt'), `${name(img)} has no alt attribute. Every <img> needs one, even if it is alt="".`);
  }
});

test('2) the photos say what they show', () => {
  for (const img of [hero(), ...photos()]) {
    const alt = (img.getAttribute('alt') || '').trim();
    assert.ok(alt, `${name(img)} is a photo that tells part of the story: its alt text says what it shows.`);
    assert.ok(!/\.(jpe?g|png|webp|avif)$/i.test(alt), `${name(img)}: alt="${alt}" is a file name. Say what the photo shows.`);
    assert.ok(!/^(an? )?(image|picture|photo) of\b/i.test(alt),
      `${name(img)}: a screen reader already says "image", so alt="${alt}" doesn't need to start with "${alt.split(' of')[0]} of".`);
    assert.ok(alt.split(/\s+/).length >= 3, `${name(img)}: alt="${alt}" is too short to say what the photo shows.`);
  }
});

test('3) a caption and its alt text say different things', () => {
  for (const figure of all('figure')) {
    const img = figure.querySelector('img');
    const caption = figure.querySelector('figcaption');
    if (!img || !caption) continue;
    assert.notEqual((img.getAttribute('alt') || '').trim(), caption.textContent.trim(),
      `${name(img)}: the alt text repeats the caption, so a screen reader reads it twice. Say what the photo shows instead.`);
  }
});

test('4) the logo says where it goes, and the wave is decorative', () => {
  const alt = (logo()?.getAttribute('alt') || '').trim();
  assert.ok(alt, 'The logo is a link: its alt text says where the link goes.');
  assert.ok(!/^logo$/i.test(alt), 'alt="logo" says what the picture is, not where the link goes.');
  assert.ok(wave(), 'Keep the wave picture between the introduction and the story.');
  assert.equal(wave().getAttribute('alt'), '', 'The wave is decoration, so it gets an empty alt: alt="".');
});

test('5) every picture has width and height', () => {
  for (const img of all('img')) {
    for (const attribute of ['width', 'height']) {
      const value = img.getAttribute(attribute);
      assert.ok(/^[1-9]\d*$/.test(value || ''),
        `${name(img)} needs a ${attribute} attribute: a whole number of pixels, with no "px".`);
    }
  }
});

test('6) the photos keep their shape', () => {
  const shapes = [[hero(), 16 / 9, '16:9 (1600 by 900)'], ...photos().map((img) => [img, 4 / 3, '4:3 (1600 by 1200)'])];
  for (const [img, shape, words] of shapes) {
    const ratio = Number(img.getAttribute('width')) / Number(img.getAttribute('height'));
    assert.ok(Math.abs(ratio - shape) < 0.02,
      `${name(img)}: width and height should have the shape of its files, ${words}. The table in README.md has the sizes.`);
  }
});

test('7) the pictures on the first screen load right away', () => {
  for (const img of [logo(), hero()]) {
    assert.notEqual(img.getAttribute('loading'), 'lazy',
      `${name(img)} is on the first screen people see, so it must not wait: take loading="lazy" off it.`);
  }
  assert.equal(hero().getAttribute('fetchpriority'), 'high',
    'The big photo at the top is the most important picture: give it fetchpriority="high".');
});

test('8) the photos further down load lazily', () => {
  for (const img of photos()) {
    assert.equal(img.getAttribute('loading'), 'lazy', `${name(img)} is further down the page: give it loading="lazy".`);
  }
});

test('9) the photos offer three widths with srcset and sizes', () => {
  for (const img of photos()) {
    const list = candidates(img.getAttribute('srcset'));
    assert.ok(list.length >= 3, `${name(img)} needs a srcset with its 480, 960 and 1600 copies.`);
    for (const [address, descriptor] of list) {
      assert.ok(/^\d+w$/.test(descriptor || ''), `${name(img)}: "${address}" in srcset needs a w descriptor, such as 960w.`);
    }
    assert.ok((img.getAttribute('sizes') || '').trim(),
      `${name(img)} needs a sizes attribute: how wide the photo is shown (at most 720 pixels).`);
  }
});

test('10) the big photo at the top offers a modern format', () => {
  const picture = hero().closest('picture');
  assert.ok(picture, 'Put the big photo at the top inside a <picture>.');
  const source = picture.querySelector('source[type="image/avif"], source[type="image/webp"]');
  assert.ok(source, 'Give the <picture> a <source> with type="image/avif" or type="image/webp".');
  for (const each of picture.querySelectorAll('source')) {
    assert.ok(candidates(each.getAttribute('srcset')).length >= 3, 'Each <source> needs a srcset with the 480, 960 and 1600 copies.');
    assert.ok((each.getAttribute('sizes') || '').trim(), 'Each <source> needs sizes too: the photo is shown the full width of the window.');
  }
  assert.ok(/\.jpe?g$/i.test(hero().getAttribute('src') || ''), 'The <img> inside the <picture> is the fallback: its src is a JPEG.');
});

test('11) no picture loads a full-size original', () => {
  for (const element of all('img, source')) {
    const addresses = [element.getAttribute('src'), ...candidates(element.getAttribute('srcset')).map(([address]) => address)];
    for (const address of addresses.filter(Boolean)) {
      assert.ok(!address.includes('originals/'),
        `"${address}" is a full-size phone photo. Use the resized copies in images/ instead.`);
    }
  }
});

test('12) every picture file the page names exists', () => {
  for (const element of all('img, source')) {
    const addresses = [element.getAttribute('src'), ...candidates(element.getAttribute('srcset')).map(([address]) => address)];
    for (const address of addresses.filter(Boolean)) {
      assert.ok(existsSync(address), `"${address}" isn't in the folder. Check its spelling against the files in images/.`);
    }
  }
});

test('13) the page passes the HTML validator', async () => {
  const validator = new HtmlValidate({ extends: ['html-validate:recommended'] });
  const report = await validator.validateString(html, 'index.html');
  const problems = report.results.flatMap((result) => result.messages)
    .map((message) => `line ${message.line}: ${message.message} (${message.ruleId})`);
  assert.deepEqual(problems, [], `The validator found:\n${problems.join('\n')}`);
});
