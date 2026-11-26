# Exercise: Speed Up the Travel Blog

Exercise code for the lesson **Exercise: Speed Up the Travel Blog** in the HTML in Depth course on [ask-codey.com](https://www.ask-codey.com).

Marisol's travel blog, *Postcards from the Coast*, loads six photos straight from her phone, several megabytes each, and most of them have no useful alt text. You'll change only `index.html`: alt text by purpose, width and height, lazy loading, `srcset` and `sizes`, a `<picture>` element for the big photo at the top, an image map that makes each stop on Marisol's trip map a link, and a small *trip at a glance* drawn in SVG, with shading. Then you'll measure how much lighter the page got. Tests check each step.

## What's here

- `index.html`: the blog post. For you to finish. The comment at the top lists the six steps.
- `style.css`: the page's styles. Ready to use. Its `img` rule lets pictures shrink to fit a narrow screen and keep their shape.
- `images/originals/`: the six photos as they came off the phone. Ready to use, and the page shouldn't load any of them when you're done.
- `images/`: every photo resized for you in three widths (480, 960 and 1600 pixels) and three formats (`.jpg`, `.webp` and `.avif`), plus the logo (`logo.svg`), a decorative wave (`wave.svg`) and Marisol's map of the trip (`trip-map.png`). Ready to use.
- `page.test.js` and `package.json`: the tests that check your page. You don't need to change these.

## The picture files

| Picture | What it shows | Files | Width × height in pixels |
|---|---|---|---|
| The logo, in the header | The blog's name, *Postcards from the Coast*. It links to the home page | `logo.svg` | 240 × 60 |
| The big photo at the top | The coast road above a sandy cove | `coast-480`, `coast-960`, `coast-1600` | 480 × 270, 960 × 540, 1600 × 900 |
| The wave | A wavy line between the introduction and the story. Decoration only | `wave.svg` | 600 × 40 |
| The trip map, under the introduction | Marisol's map of the coast road and the trip's five stops. It already has its alt text, width, height and loading | `trip-map.png` | 640 × 400 |
| Day 1 | Gull Point Lighthouse | `lighthouse-480`, `-960`, `-1600` | 480 × 360, 960 × 720, 1600 × 1200 |
| Day 1 | A tide pool | `tide-pool-480`, `-960`, `-1600` | the same as the lighthouse |
| Day 2 | The taco stand and its hand-painted sign | `taco-stand-480`, `-960`, `-1600` | the same |
| Day 3 | Kayaks on the bay | `kayaks-480`, `-960`, `-1600` | the same |
| Day 3 | The sunset | `sunset-480`, `-960`, `-1600` | the same |

Every photo comes as `.jpg`, `.webp` and `.avif`, for example `lighthouse-960.jpg`, `lighthouse-960.webp` and `lighthouse-960.avif`.

## Run it

Open the folder in VS Code, right-click `index.html` and choose **Open with Live Server**. The page opens in your browser and reloads each time you save.

## Measure it first

Before you change anything, measure how heavy the page is:

1. In the browser, press **F12** to open the developer tools, and choose the **Network** panel.
2. Tick **Disable cache**, and choose the **Img** filter.
3. Reload the page. The bar at the bottom says how many requests there were and how much was **transferred**. Write that number down.

## What to do

Follow the eight steps in the comment at the top of `index.html`, running the tests after each one.

1. **Alt text by purpose.** Each photo's alt text says what the photo shows, in a short sentence, without "image of". The logo is a link, so its alt text says where it goes. The wave is decoration, so its alt is empty: `alt=""`. A caption and its photo's alt text say different things.
2. **Width and height** on every `<img>`, from the table above. For the photos, use the size of the 1600 copy.
3. **Loading.** The logo and the big photo at the top load right away, and the big photo gets `fetchpriority="high"`. Every photo further down gets `loading="lazy"`.
4. **`srcset` and `sizes`** for the five photos further down, with their 480, 960 and 1600 JPEG copies. They're shown at most 720 pixels wide, and the full width of a narrower screen.
5. **A `<picture>`** for the big photo at the top: a `<source>` for AVIF and one for WebP, each with its three widths, and the JPEG `<img>` as the fallback. It's shown the full width of the window.
6. **An image map for the trip map.** Give the trip map's `<img>` a `usemap`, and add a `<map>` with that name holding one `<area>` for each stop in the table below: its `shape`, its `coords` (written as the table shows them), an `href` to that day's heading, and alt text that says where it goes. Then, right under the map, put the same five links in a list of text links, for everyone the map leaves out.

   | Stop | shape | coords | Links to |
   |---|---|---|---|
   | Gull Point Lighthouse | `circle` | `120,100,50` | `#lighthouse` |
   | The tide pools | `rect` | `60,190,200,260` | `#tide-pools` |
   | The Salty Gull taco stand | `rect` | `300,200,420,280` | `#taco-stand` |
   | The harbor, for kayaking the bay | `poly` | `440,290,600,280,620,380,460,390` | `#kayaking` |
   | The sunset lookout | `circle` | `250,60,40` | `#sunset` |

   The coords are pixels of the map at its full size, 640 by 400, counted from its top-left corner. Each day's heading already has its `id`.
7. **The trip at a glance, drawn in SVG.** Right under the byline, before the introduction, an inline `<svg>` 600 pixels wide and 80 tall, on a grid of `0 0 600 80`. It means something, so a screen reader reads it as one picture: `role="img"` on the `<svg>`, and a `<title>` as its first element that says what it shows, such as *The trip at a glance: three days on the coast road, from Gull Point to the harbor*. Inside it:

   | Part | Element | Its numbers |
   |---|---|---|
   | The road | `<line>` | from 60,30 to 540,30, with `stroke="#1d6f8c"` and `stroke-width="6"` |
   | Day 1, Day 2, Day 3 | three `<circle>`s | centered at 60,30, 300,30 and 540,30, each with a radius of 14, filled `#f4a259` |
   | Their labels | three `<text>`s | *Day 1*, *Day 2* and *Day 3*, at `x` 60, 300 and 540 and `y` 70, with `text-anchor="middle"` |

   Drawn in the page, it costs no request at all.
8. **Shading for the trip at a glance.** At the start of the strip's `<svg>`, add a `<defs>` holding a `<radialGradient>` with the `id` `sun` (two stops: `#fff3b0` at 0% and `#f4a259` at 100%) and a `<filter>` with the `id` `lift` holding an `<feDropShadow>` (`dx="2"`, `dy="3"`, `stdDeviation="2"`). Then give each day's circle `fill="url(#sun)"` and `filter="url(#lift)"`.

## Check your work

In VS Code's terminal (**Terminal > New Terminal**), in this folder:

```bash
npm install
npm test
```

You only need `npm install` once. At first almost every test fails: that is expected. Each step you finish turns its tests green, and a failing test's message names the picture and what it still needs.

## Measure it again

Reload the page with the Network panel open, as before. Compare the **transferred** number with the one you wrote down. Then turn on the device toolbar (**Ctrl+Shift+M**, or **Cmd+Shift+M** on a Mac), choose a phone, reload, and look at which files the browser chose and how many photos it loaded before you scrolled.

## Checklist the tests can't check

- [ ] Each alt text describes what you see in that photo. Read them aloud with the photos hidden: does the post still make sense?
- [ ] The taco stand's alt text includes the words on its sign.
- [ ] Nothing on the page jumps down when a photo arrives (try the Network panel's **Slow 4G** setting).
- [ ] The trip at a glance stays sharp when you zoom the browser in, and each day's circle glows from its middle and sits on a soft shadow.
- [ ] On a wide window, moving the pointer over each stop on the trip map turns it into a hand, and clicking it jumps to that day. Then make the window narrow, so the map shrinks, and try again: the spots no longer line up, which is why the text links are there.

## Tips

- Every `srcset` entry is a file, a space and its width with a `w`, such as `images/lighthouse-960.jpg 960w`. Commas go between the entries.
- `sizes` describes how wide the picture is shown, not how wide the files are. The lesson *Responsive Images with srcset and sizes* has the pattern for "the full width of a narrow screen, and at most 720 pixels".
- Inside a `<picture>`, the `<source>` elements come first and the `<img>` comes last. The `alt`, `width`, `height` and `fetchpriority` go on the `<img>`.
- When a test says a file isn't in the folder, compare the spelling with the file names in `images/`: `tide-pool`, with a hyphen.
- `usemap` is the map's name with a `#` in front: `usemap="#trip-map"` finds `<map name="trip-map">`. An `<area>` has no closing tag, and its `coords` are numbers with commas between them and no spaces. The lesson *Clickable Regions of a Picture: Image Maps* shows all three shapes.
- SVG is fussier than HTML: close every element (`<circle ... />`), and write `viewBox` with a capital B. *Pictures Made of Code: SVG* has every shape, and *Shading and Shadows in SVG: Gradients and Filters* has `<defs>` and `url(#id)`.

## Hand it in

When it works, put your solution in a public repo of your own on GitHub, then paste that repo's address into **Submit your exercise** on the lesson page at [ask-codey.com](https://www.ask-codey.com). That's what completes the lesson. You don't need Git: create the repo on GitHub, choose **Add file**, then **Upload files**, and upload everything in this folder except `node_modules` (it's the files `npm install` downloaded, far too many for GitHub's upload, and `npm install` makes it again). The lesson page shows each step, and the lesson *Put Your Work on GitHub* walks through every screen.
