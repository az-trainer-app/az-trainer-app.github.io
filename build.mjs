// Builds a page per supported game, plus the home page's game list and the
// sitemap, from `games.json` - which the trainer itself produces:
//
//     cargo run --bin cfgcheck -- --json configs/games > ../az-trainer-app.github.io/games.json
//     node build.mjs
//
// So every option and shortcut listed on the site is one the trainer really
// offers. A game with no page of its own has nothing to rank for; a page that
// lists the wrong options is worse than none.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SITE = 'https://az-trainer-app.github.io';
const REPO = 'https://github.com/az-trainer-app/az_trainer';
const RAW = 'https://raw.githubusercontent.com/az-trainer-app/az_trainer/main';

// What only the site knows: newest game first, by Steam release date, and the
// height its screenshot was taken at.
const META = {
  onimusha: { released: '2026-09-03', shot: 477 },
  dawnwalker: { released: '2026-09-02', shot: 569 },
  resonance: { released: '2026-08-27', shot: 287 },
  firstlight: { released: '2026-05-26', shot: 329 },
  veilguard: { released: '2024-10-31', shot: 569 },
  wukong: { released: '2024-08-19', shot: 612 },
  requiem: { released: '2022-10-17', shot: 244 },
  innocence: { released: '2019-05-14', shot: 244 },
};

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const games = JSON.parse(readFileSync('games.json', 'utf8'))
  .filter((g) => META[g.id])
  .sort((a, b) => META[b.id].released.localeCompare(META[a.id].released));

/** The options a page lists, as rows under their headings. */
function rows(game) {
  const out = [];
  let group = null;
  for (const o of game.options) {
    if (o.separator !== null) {
      group = o.separator || null;
      continue;
    }
    const levels = o.levels.length
      ? o.levels.map((l, i) => o.labels[i] || `${l}x`).join(' · ')
      : 'On / off';
    out.push({ group, name: o.name, levels, keys: o.keys });
  }
  return out;
}

/** A sentence naming what the trainer does for this game. */
function summary(game, list) {
  const names = list.map((r) => r.name.toLowerCase());
  const first = names.slice(0, 3).join(', ');
  const rest = names.length > 3 ? ` and ${names.length - 3} more options` : '';
  return `${first}${rest}`;
}

function page(game) {
  const list = rows(game);
  const meta = META[game.id];
  const what = summary(game, list);
  const title = esc(game.title);
  const desc = `Free, open-source ${game.title} trainer for Windows: ${what}. No ads, no spyware, no installer.`;
  const shot = `${RAW}/docs/${game.id}.png`;
  const groups = [...new Set(list.map((r) => r.group))];
  const hotkeys = list.some((r) => r.keys.length);
  // each shortcut its own key caps: "Alt+F1, Alt+F2"
  const caps = (keys) =>
    keys.map((k) => `<kbd>${esc(k).split('+').join('</kbd>+<kbd>')}</kbd>`).join(', ');

  const table = groups
    .map((g) => {
      const body = list
        .filter((r) => r.group === g)
        .map(
          (r) => `          <tr>
            <th scope="row">${esc(r.name)}</th>
            <td>${esc(r.levels)}</td>
            ${hotkeys ? `<td>${r.keys.length ? caps(r.keys) : '—'}</td>` : ''}
          </tr>`,
        )
        .join('\n');
      return `        <tbody>
${g ? `          <tr><th class="group" colspan="${hotkeys ? 3 : 2}" scope="colgroup">${esc(g)}</th></tr>\n` : ''}${body}
        </tbody>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} Trainer · Free and open source · AZ Trainer</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}/games/${game.id}/">
<meta name="theme-color" content="#11131a">
<meta property="og:type" content="website">
<meta property="og:site_name" content="AZ Trainer">
<meta property="og:url" content="${SITE}/games/${game.id}/">
<meta property="og:title" content="${title} Trainer · AZ Trainer">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${shot}">
<meta property="og:image:alt" content="AZ Trainer attached to ${title}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} Trainer · AZ Trainer">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${shot}">
<script type="application/ld+json">
${JSON.stringify(
  {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: `AZ Trainer for ${game.title}`,
        description: desc,
        url: `${SITE}/games/${game.id}/`,
        downloadUrl: `${REPO}/releases/latest/download/az_trainer.exe`,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Windows 10, Windows 11',
        license: 'https://opensource.org/licenses/MIT',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        screenshot: shot,
        codeRepository: REPO,
        featureList: list.map((r) => r.name),
        about: { '@type': 'VideoGame', name: game.title, gamePlatform: 'PC' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'AZ Trainer', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: `${game.title} Trainer` },
        ],
      },
    ],
  },
  null,
  2,
)}
</script>
<link rel="icon" href="../../favicon.ico" sizes="any">
<link rel="icon" type="image/png" href="../../icon.png">
<link rel="apple-touch-icon" href="../../apple-touch-icon.png">
<link rel="stylesheet" href="../../style.css">
</head>
<body>

<header class="top">
  <div class="wrap">
    <a class="brand" href="../../"><img class="mark" src="../../icon.png" alt="" width="28" height="28">AZ Trainer</a>
    <nav class="links">
      <a href="../../#games">Games</a>
      <a class="opt" href="../../#how">How it works</a>
      <a class="opt" href="../../#features">Features</a>
      <a href="${REPO}">GitHub</a>
    </nav>
  </div>
</header>

<main>
  <div class="hero">
    <div class="wrap">
      <div>
        <nav class="crumbs" aria-label="Breadcrumb"><a href="../../">AZ Trainer</a> <span>/</span> ${title}</nav>
        <h1>${title} Trainer</h1>
        <p class="lede">A free, open-source trainer for ${title} on Windows. It attaches to the running game on its own and gives you ${what}.</p>
        <div class="cta">
          <a class="btn primary" href="${REPO}/releases/latest/download/az_trainer.exe">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16"/></svg>
            Download AZ Trainer
          </a>
          <a class="btn ghost" href="${REPO}/blob/main/configs/games/${game.id}.js">Read this game's script</a>
        </div>
        <div class="trust">
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Open Source</span>
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>No Ads</span>
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>No Spyware</span>
        </div>
        <div class="meta">Windows 10 and 11 · Single executable, no installation · For single-player use</div>
      </div>
      <div class="shot-hero">
        <div class="live" data-game="${game.id}" data-title="${title}">
          <img src="${shot}" alt="AZ Trainer attached to ${title}" width="527" height="${meta.shot}">
        </div>
      </div>
    </div>
  </div>

  <section>
    <div class="wrap">
      <h2>Options for ${title}</h2>
      <p class="sub">Every option in the ${title} script${hotkeys ? ', with the shortcut that toggles it in game' : ''}. Turning the trainer off restores the game exactly as it was.</p>
      <div class="table-wrap">
        <table class="opts">
          <thead>
            <tr><th scope="col">Option</th><th scope="col">Setting</th>${hotkeys ? '<th scope="col">Shortcut</th>' : ''}</tr>
          </thead>
${table}
        </table>
      </div>
      <p class="note">The script is read before it runs and is never hidden from you: see <a href="${REPO}/blob/main/configs/games/${game.id}.js">configs/games/${game.id}.js</a>. ${title} was released on ${new Date(meta.released + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}; the trainer checks the build it attaches to and stays out of the way when it does not recognise it.</p>
    </div>
  </section>

  <section>
    <div class="wrap">
      <h2>How to use it</h2>
      <div class="grid3">
        <div class="card"><div class="n">1</div><h4>Download</h4><p>Save <code>az_trainer.exe</code> in a folder of its own. On first launch it fetches the game scripts, including this one.</p></div>
        <div class="card"><div class="n">2</div><h4>Start ${title}</h4><p>AZ Trainer recognises the running game and its version, then attaches by itself.</p></div>
        <div class="card"><div class="n">3</div><h4>Pick your options</h4><p>Tick them in the window${hotkeys ? ' or use the shortcuts above' : ''}. Closing the trainer reverts every change.</p></div>
      </div>
      <p class="note"><strong>Windows SmartScreen warning.</strong> On first launch Windows may report that <em>Microsoft Defender SmartScreen prevented an unrecognized app from starting</em>. AZ Trainer is not code-signed, so new releases have not yet built up download reputation. Select <strong>More info</strong>, then <strong>Run anyway</strong>. To confirm the file is genuine, compare <code>Get-FileHash az_trainer.exe</code> with <code>az_trainer.exe.sha256</code> on the <a href="${REPO}/releases/latest">release page</a>.</p>
    </div>
  </section>

  <section>
    <div class="wrap">
      <h2>Other supported games</h2>
      <ul class="game-list">
${games
  .filter((g) => g.id !== game.id)
  .map((g) => `        <li><a href="../${g.id}/">${esc(g.title)}</a></li>`)
  .join('\n')}
      </ul>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <span>For single-player games only. Not intended for online or competitive play.</span>
    <span><a href="${REPO}/blob/main/LICENSE">MIT License</a> · <a href="${REPO}/releases">Releases</a> · <a href="${REPO}">GitHub</a></span>
  </div>
</footer>

</body>
</html>
`;
}

// ---- write the pages ------------------------------------------------------
for (const game of games) {
  mkdirSync(`games/${game.id}`, { recursive: true });
  writeFileSync(`games/${game.id}/index.html`, page(game));
}

// ---- the home page's list, now links --------------------------------------
const list = `      <ul class="game-list" aria-label="Supported games">
${games.map((g) => `        <li><a href="games/${g.id}/">${esc(g.title)} Trainer</a></li>`).join('\n')}
      </ul>`;
let home = readFileSync('index.html', 'utf8');
home = home.replace(
  /<!-- games:list -->[\s\S]*?<!-- \/games:list -->/,
  `<!-- games:list -->\n${list}\n      <!-- /games:list -->`,
);
writeFileSync('index.html', home);

// ---- sitemap --------------------------------------------------------------
const today = new Date().toISOString().slice(0, 10);
const urls = [
  `  <url>\n    <loc>${SITE}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
  ...games.map(
    (g) =>
      `  <url>\n    <loc>${SITE}/games/${g.id}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
  ),
];
writeFileSync(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
);

console.log(`${games.length} game pages, home list and sitemap written`);
