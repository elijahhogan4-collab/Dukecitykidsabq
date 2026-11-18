// Duke City Kids static site builder. No dependencies: `node build.js` writes the site to ./dist
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT = path.join(ROOT, "dist");
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "data/site.json"), "utf8"));
const listings = JSON.parse(fs.readFileSync(path.join(ROOT, "data/listings.json"), "utf8"));

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const catBySlug = Object.fromEntries(site.categories.map((c) => [c.slug, c]));
const year = new Date().getFullYear();

function layout({ title, description, canonical, body, jsonLd }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${site.url}${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${site.url}${canonical}">
<meta property="og:type" content="website">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800&family=Nunito+Sans:wght@400;600;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}
</head>
<body>
<header class="top">
  <div class="wrap top-inner">
    <a class="logo" href="/"><span class="sun" aria-hidden="true"></span>Duke City <b>Kids</b></a>
    <nav class="nav">
      ${site.categories.map((c) => `<a href="/${c.slug}/">${esc(c.name)}</a>`).join("")}
      <a class="nav-cta" href="/list-your-business/">List your business</a>
    </nav>
  </div>
</header>
<main>${body}</main>
<footer class="foot">
  <div class="wrap foot-inner">
    <div><a class="logo small" href="/"><span class="sun" aria-hidden="true"></span>Duke City <b>Kids</b></a>
    <p>A local guide to kids' activities in Albuquerque &amp; Rio Rancho.</p></div>
    <div class="foot-links">
      ${site.categories.map((c) => `<a href="/${c.slug}/">${esc(c.name)}</a>`).join("")}
      <a href="/military-families/">Military families</a>
      <a href="/list-your-business/">List your business</a>
    </div>
  </div>
  <p class="wrap fine">© ${year} Duke City Kids. Listings are compiled from public information — always confirm details with the business.</p>
</footer>
</body>
</html>`;
}

function card(l) {
  const cat = catBySlug[l.category];
  const facts = [
    l.ages && `<li><span>Ages</span>${esc(l.ages)}</li>`,
    l.price && `<li><span>Price</span>${esc(l.price)}</li>`,
    l.area && `<li><span>Area</span>${esc(l.area)}</li>`,
  ].filter(Boolean).join("");
  const mapQ = encodeURIComponent(`${l.name} ${l.address || ""} Albuquerque NM`);
  return `<article class="card${l.featured ? " featured" : ""}" data-area="${esc(l.area)}" data-military="${l.military ? "yes" : "no"}" data-text="${esc((l.name + " " + (l.notes || "") + " " + (l.area || "")).toLowerCase())}">
  <div class="card-top">
    <span class="chip">${cat.emoji} ${esc(cat.name)}</span>
    ${l.featured ? `<span class="chip gold">Featured</span>` : ""}
    ${l.military ? `<span class="chip mil">★ Military discount</span>` : ""}
  </div>
  <h3>${esc(l.name)}</h3>
  ${l.notes ? `<p class="notes">${esc(l.notes)}</p>` : ""}
  ${facts ? `<ul class="facts">${facts}</ul>` : ""}
  <div class="card-actions">
    ${l.phone ? `<a class="btn ghost" href="tel:${esc(l.phone.replace(/[^0-9+]/g, ""))}">Call</a>` : ""}
    ${l.website ? `<a class="btn ghost" href="${esc(l.website)}" rel="nofollow noopener" target="_blank">Website</a>` : ""}
    <a class="btn ghost" href="https://www.google.com/maps/search/?api=1&query=${mapQ}" rel="nofollow noopener" target="_blank">Map</a>
  </div>
</article>`;
}

function businessLd(l) {
  return {
    "@type": "LocalBusiness",
    name: l.name,
    ...(l.address ? { address: l.address } : {}),
    ...(l.phone ? { telephone: l.phone } : {}),
    ...(l.website ? { url: l.website } : {}),
    areaServed: "Albuquerque, NM",
  };
}

const sortListings = (arr) => [...arr].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.name.localeCompare(b.name));

function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

// ---- build ----
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(path.join(ROOT, "public"))) fs.copyFileSync(path.join(ROOT, "public", f), path.join(OUT, f));

// Home
const counts = Object.fromEntries(site.categories.map((c) => [c.slug, listings.filter((l) => l.category === c.slug).length]));
write("index.html", layout({
  title: "Duke City Kids — Kids' Activities in Albuquerque, NM",
  description: "Find swim lessons, martial arts, dance, gymnastics, summer camps and tutoring for kids in Albuquerque and Rio Rancho — with ages, prices and military-family discounts.",
  canonical: "/",
  jsonLd: { "@context": "https://schema.org", "@type": "WebSite", name: site.name, url: site.url },
  body: `
<section class="hero">
  <div class="wrap">
    <p class="eyebrow">Albuquerque · Rio Rancho · Westside · NE Heights</p>
    <h1>What are the kids <em>doing</em> this week?</h1>
    <p class="lede">Swim lessons, martial arts, dance, camps and tutoring across the Duke City — ages, prices and locations in one place.</p>
    <form class="search" action="/search/" method="get" role="search">
      <input name="q" type="search" placeholder="Try “swim”, “karate”, “Westside”…" aria-label="Search activities">
      <button class="btn">Search</button>
    </form>
  </div>
</section>
<section class="wrap cats">
  ${site.categories.map((c) => `<a class="cat" href="/${c.slug}/"><span class="cat-emoji">${c.emoji}</span><b>${esc(c.name)}</b><small>${counts[c.slug]} listings</small></a>`).join("")}
</section>
<section class="wrap band">
  <div>
    <h2>Military family? We've got you.</h2>
    <p>Kirtland families move a lot. We flag businesses that offer military discounts so you can get the kids signed up fast after a PCS.</p>
  </div>
  <a class="btn light" href="/military-families/">Military-friendly listings</a>
</section>
<section class="wrap split">
  <div>
    <h2>Run a kids' program in ABQ?</h2>
    <p>Get in front of local parents who are searching right now. Basic listings are free; featured spots put you at the top of your category.</p>
  </div>
  <a class="btn" href="/list-your-business/">List your business</a>
</section>`,
}));

// Category pages
for (const c of site.categories) {
  const items = sortListings(listings.filter((l) => l.category === c.slug));
  const areas = [...new Set(items.map((l) => l.area).filter(Boolean))].sort();
  write(`${c.slug}/index.html`, layout({
    title: `${c.name} for Kids in Albuquerque, NM (${year}) — Duke City Kids`,
    description: `Compare ${items.length} options for kids' ${c.name.toLowerCase()} in Albuquerque & Rio Rancho: ages, prices, locations and military discounts.`,
    canonical: `/${c.slug}/`,
    jsonLd: { "@context": "https://schema.org", "@type": "ItemList", name: `${c.name} in Albuquerque`, itemListElement: items.map((l, i) => ({ "@type": "ListItem", position: i + 1, item: businessLd(l) })) },
    body: `
<section class="page-head">
  <div class="wrap">
    <p class="crumbs"><a href="/">Home</a> / ${esc(c.name)}</p>
    <h1>${c.emoji} ${esc(c.name)} for Kids in Albuquerque</h1>
    <p class="lede">${esc(c.blurb)}</p>
  </div>
</section>
<section class="wrap">
  <div class="filters" data-filters>
    <input type="search" placeholder="Filter by name or keyword" data-q aria-label="Filter listings">
    <select data-area aria-label="Filter by area"><option value="">All areas</option>${areas.map((a) => `<option>${esc(a)}</option>`).join("")}</select>
    <label class="check"><input type="checkbox" data-mil> Military discount</label>
  </div>
  <p class="count" data-count>${items.length} listings</p>
  <div class="grid" data-grid>${items.map(card).join("")}</div>
  <p class="empty" data-empty hidden>No matches. Try clearing a filter.</p>
  <aside class="note">Is your business missing or out of date? <a href="/list-your-business/">Add or update your listing — it's free.</a></aside>
</section>
<script src="/filter.js" defer></script>`,
  }));
}

// Military families
const mil = sortListings(listings.filter((l) => l.military));
write("military-families/index.html", layout({
  title: "Military Discounts on Kids' Activities in Albuquerque — Duke City Kids",
  description: "Kids' activities in Albuquerque that offer military discounts — a guide for Kirtland AFB and New Mexico Guard families.",
  canonical: "/military-families/",
  body: `
<section class="page-head"><div class="wrap">
  <p class="crumbs"><a href="/">Home</a> / Military families</p>
  <h1>★ Military-friendly kids' activities</h1>
  <p class="lede">For Kirtland AFB, Guard and veteran families. These businesses have told us they offer a military discount.</p>
</div></section>
<section class="wrap">
  ${mil.length ? `<div class="grid">${mil.map(card).join("")}</div>` : `<div class="note big"><h2>We're building this list now.</h2><p>We're calling every business in the directory to ask about military discounts. Know one that offers a discount? <a href="mailto:${site.contactEmail}?subject=Military%20discount%20tip">Send us a tip</a>.</p></div>`}
</section>`,
}));

// List your business
write("list-your-business/index.html", layout({
  title: "List Your Kids' Business in Albuquerque — Duke City Kids",
  description: "Add your kids' program to Duke City Kids for free, or get a featured spot in front of Albuquerque parents.",
  canonical: "/list-your-business/",
  body: `
<section class="page-head"><div class="wrap">
  <p class="crumbs"><a href="/">Home</a> / List your business</p>
  <h1>Get in front of Albuquerque parents</h1>
  <p class="lede">Parents come here looking for swim lessons, classes and camps. Make sure they find you.</p>
</div></section>
<section class="wrap plans">
  <div class="plan">
    <h2>Basic</h2><p class="price">Free</p>
    <ul><li>Your business in its category</li><li>Ages, prices, phone &amp; map link</li><li>Military-discount badge if you offer one</li></ul>
    <a class="btn ghost" href="mailto:${site.contactEmail}?subject=Free%20listing%20request">Claim free listing</a>
  </div>
  <div class="plan pop">
    <h2>Featured</h2><p class="price">$29<small>/mo</small></p>
    <ul><li>Top of your category page</li><li>Highlighted card with “Featured” badge</li><li>Link to your website &amp; booking page</li><li>Shown on the home page</li></ul>
    <a class="btn" href="mailto:${site.contactEmail}?subject=Featured%20listing">Get featured</a>
  </div>
</section>
<section class="wrap"><p class="note">Founding offer: the first 10 featured businesses lock in $29/mo for life.</p></section>`,
}));

// Search page (client side, all listings embedded)
write("search/index.html", layout({
  title: "Search — Duke City Kids",
  description: "Search kids' activities in Albuquerque.",
  canonical: "/search/",
  body: `
<section class="page-head"><div class="wrap"><h1>Search</h1>
  <div class="filters" data-filters><input type="search" placeholder="Search all activities" data-q aria-label="Search" autofocus>
  <label class="check"><input type="checkbox" data-mil> Military discount</label></div>
</div></section>
<section class="wrap">
  <p class="count" data-count></p>
  <div class="grid" data-grid>${sortListings(listings).map(card).join("")}</div>
  <p class="empty" data-empty hidden>No matches.</p>
</section>
<script src="/filter.js" defer></script>`,
}));

// 404
write("404.html", layout({
  title: "Page not found — Duke City Kids", description: "Page not found.", canonical: "/404",
  body: `<section class="page-head"><div class="wrap"><h1>Lost in the bosque?</h1><p class="lede">That page doesn't exist. <a href="/">Head home</a>.</p></div></section>`,
}));

// Sitemap & robots
const pages = ["/", ...site.categories.map((c) => `/${c.slug}/`), "/military-families/", "/list-your-business/"];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${site.url}${p}</loc></url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);

console.log(`Built ${pages.length + 2} pages, ${listings.length} listings → dist/`);
