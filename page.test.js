// Checks the travel blog's pictures: alt text, sizes, loading, srcset, the picture element, the trip map's image map, and the trip at a glance drawn in SVG.
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

// The trip map's five stops, as the README's table gives them: each area's link, shape and coords.
const STOPS = [
  { href: '#lighthouse', shape: 'circle', coords: '120,100,50', name: 'Gull Point Lighthouse' },
  { href: '#tide-pools', shape: 'rect', coords: '60,190,200,260', name: 'the tide pools' },
  { href: '#taco-stand', shape: 'rect', coords: '300,200,420,280', name: 'the taco stand' },
  { href: '#kayaking', shape: 'poly', coords: '440,290,600,280,620,380,460,390', name: 'the harbor' },
  { href: '#sunset', shape: 'circle', coords: '250,60,40', name: 'the sunset lookout' },
];
const tripMap = () => all('img').find((img) => (img.getAttribute('src') || '').includes('trip-map'));
// The map the trip map's usemap names: "#trip-map" finds <map name="trip-map">.
const mapOf = (img) => {
  const ref = (img && img.getAttribute('usemap')) || '';
  return ref.startsWith('#') ? all('map').find((map) => map.getAttribute('name') === ref.slice(1)) : undefined;
};

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

test('14) the trip map uses an image map', () => {
  const img = tripMap();
  assert.ok(img, 'Keep the trip map (images/trip-map.png) under the introduction: step 6 turns it into an image map.');
  const ref = img.getAttribute('usemap');
  assert.ok(ref, 'Give the trip map a usemap attribute that names its map, such as usemap="#trip-map".');
  assert.ok(ref.startsWith('#'), `usemap="${ref}" needs a # in front of the map's name: usemap="#${ref}".`);
  assert.ok(mapOf(img), `usemap="${ref}" names a map the page doesn't have. Add a <map> whose name is "${ref.slice(1)}", spelled exactly the same.`);
});

test('15) every stop on the map is an area with its shape, coords, link and alt text', () => {
  const map = mapOf(tripMap());
  assert.ok(map, 'Test 14 comes first: the trip map needs a usemap that names a <map> on the page.');
  const areas = [...map.querySelectorAll('area')];
  for (const stop of STOPS) {
    const area = areas.find((each) => each.getAttribute('href') === stop.href);
    assert.ok(area, `The map has no <area> that links to ${stop.href} (${stop.name}). The README's table has each stop's shape and coords.`);
    const shape = (area.getAttribute('shape') || 'rect').toLowerCase();
    assert.equal(shape, stop.shape, `The area for ${stop.name} is shape="${shape}". The README's table says shape="${stop.shape}".`);
    const coords = (area.getAttribute('coords') || '').replace(/\s+/g, '');
    assert.equal(coords, stop.coords,
      `The area for ${stop.name} has coords="${area.getAttribute('coords') || ''}". The README's table gives coords="${stop.coords}".`);
    const alt = (area.getAttribute('alt') || '').trim();
    assert.ok(alt, `The area for ${stop.name} needs alt text that says where it goes: a screen reader reads it as the link's name.`);
    assert.ok(!/^(rect|circle|poly|area|link|click here)$/i.test(alt), `alt="${alt}" on the area for ${stop.name} doesn't say where the link goes.`);
  }
});

test('16) the same five links are on the page as text', () => {
  for (const stop of STOPS) {
    const link = all(`a[href="${stop.href}"]`).find((a) => a.textContent.trim());
    assert.ok(link,
      `Under the map, add a text link to ${stop.href} (${stop.name}). The map's spots are invisible and don't shrink on a phone, so the same links go on the page as text too.`);
  }
});

// The trip at a glance (steps 7 and 8): the inline <svg> right under the byline. SVG's element names have capitals
// (radialGradient, feDropShadow), and not every HTML reader keeps them, so its elements are found by name, ignoring case.
const strip = () => all('article svg')[0];
const inside = (svg, name) => [...svg.querySelectorAll('*')].filter((element) => element.localName.toLowerCase() === name.toLowerCase());
const DAYS = [{ x: '60', label: 'Day 1' }, { x: '300', label: 'Day 2' }, { x: '540', label: 'Day 3' }];
// The id a url(#id) value names: "url(#sun)" gives "sun".
const idIn = (value) => ((value || '').match(/^url\(\s*#([^)\s]+)\s*\)$/) || [])[1];

test('17) the trip at a glance: an inline svg under the byline, 600 by 80 on a 0 0 600 80 grid', () => {
  const svg = strip();
  assert.ok(svg, 'Right under the byline, add an inline <svg> for the trip at a glance (README step 7).');
  assert.equal(page.querySelector('.byline').nextElementSibling, svg,
    'Put the trip at a glance right under the byline, before the introduction.');
  assert.equal(svg.getAttribute('width'), '600', 'The strip is 600 pixels wide: width="600".');
  assert.equal(svg.getAttribute('height'), '80', 'The strip is 80 pixels tall: height="80".');
  assert.equal((svg.getAttribute('viewBox') || '').trim().replace(/\s+/g, ' '), '0 0 600 80',
    'Give the strip its own grid, viewBox="0 0 600 80" (a capital B in viewBox).');
});

test('18) the trip at a glance: read as one picture, with a title', () => {
  const svg = strip();
  assert.ok(svg, 'Test 17 comes first: add the strip\'s <svg>.');
  assert.equal(svg.getAttribute('role'), 'img', 'The strip means something, so a screen reader should read it as one picture: role="img" on the <svg>.');
  const title = svg.firstElementChild;
  assert.ok(title && title.localName === 'title' && title.textContent.trim().split(/\s+/).length >= 3,
    'Make a <title> the first thing inside the <svg>, saying what the strip shows, such as "The trip at a glance: three days on the coast road".');
});

test('19) the trip at a glance: the road, three days and their labels', () => {
  const svg = strip();
  assert.ok(svg, 'Test 17 comes first: add the strip\'s <svg>.');
  const road = inside(svg, 'line').find((line) => line.getAttribute('x1') === '60' && line.getAttribute('y1') === '30'
    && line.getAttribute('x2') === '540' && line.getAttribute('y2') === '30');
  assert.ok(road, 'Draw the road as a <line> from 60,30 to 540,30: x1="60" y1="30" x2="540" y2="30".');
  assert.ok(road.getAttribute('stroke') && road.getAttribute('stroke') !== 'none',
    'A line shows only with a stroke: give the road stroke="#1d6f8c" and a stroke-width.');
  const circles = inside(svg, 'circle');
  const texts = inside(svg, 'text');
  for (const day of DAYS) {
    assert.ok(circles.some((c) => c.getAttribute('cx') === day.x && c.getAttribute('cy') === '30' && c.getAttribute('r') === '14'),
      `${day.label} needs a <circle> centered at ${day.x},30 with a radius of 14: cx="${day.x}" cy="30" r="14".`);
    assert.ok(texts.some((t) => t.textContent.trim() === day.label && t.getAttribute('x') === day.x),
      `Under its circle, add <text x="${day.x}" y="70" text-anchor="middle">${day.label}</text>.`);
  }
});

test('20) the trip at a glance: each day shaded with a gradient and lifted by a shadow', () => {
  const svg = strip();
  assert.ok(svg, 'Test 17 comes first: add the strip\'s <svg>.');
  const defs = inside(svg, 'defs')[0];
  assert.ok(defs, 'Add a <defs> at the start of the strip\'s <svg>, for the gradient and the filter (README step 8).');
  const gradients = [...inside(defs, 'radialGradient'), ...inside(defs, 'linearGradient')];
  assert.ok(gradients.some((g) => g.id && inside(g, 'stop').length >= 2),
    'Inside <defs>, add a <radialGradient> with an id and two <stop> elements, from #fff3b0 to #f4a259.');
  const filters = inside(defs, 'filter').filter((f) => f.id && inside(f, 'feDropShadow').length > 0);
  assert.ok(filters.length, 'Inside <defs>, add a <filter> with an id, holding an <feDropShadow>.');
  for (const day of DAYS) {
    const circle = inside(svg, 'circle').find((c) => c.getAttribute('cx') === day.x);
    if (!circle) assert.fail('Test 19 comes first: each day needs its circle.');
    const fill = idIn(circle.getAttribute('fill'));
    assert.ok(fill && gradients.some((g) => g.id === fill),
      `${day.label}'s circle is filled with the gradient by its id: fill="url(#${gradients[0]?.id || 'sun'})".`);
    const lift = idIn(circle.getAttribute('filter'));
    assert.ok(lift && filters.some((f) => f.id === lift),
      `${day.label}'s circle is lifted by the drop shadow by its id: filter="url(#${filters[0]?.id || 'lift'})".`);
  }
});
