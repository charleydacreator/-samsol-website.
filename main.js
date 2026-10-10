/* ==========================================================
   $SAMSOL — site config. After launch, edit only this block.
   ========================================================== */
const CONFIG = {
  CONTRACT_ADDRESS: "",        // paste the token mint address at launch
  LAUNCH_TIME: "",             // e.g. "2026-10-09T21:00:00+01:00" (empty = 8 hours from first visit)
  LINKS: { telegram: "#", x: "#" },
  SUPPLY: 1000000000,          // total supply (placeholder, confirm before launch)
  ALLOCATION: [                // placeholder split, confirm before launch
    { name: "Liquidity pool", pct: 80, color: "#ffffff" },
    { name: "Community & airdrops", pct: 10, color: "#4fd8ff" },
    { name: "Marketing", pct: 5, color: "#8aa4ff" },
    { name: "Development", pct: 5, color: "#2f6bff" }
  ],
  REFRESH_MS: 30000
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const DEMO = new URLSearchParams(location.search).has("demo"); // ?demo=1 previews the live state
const CA = CONFIG.CONTRACT_ADDRESS.trim();
const hasCA = !!CA;

/* ---------- Helpers ---------- */
const fmtUsd = n => {
  if (!isFinite(n)) return "0.00";
  if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n === 0) return "0.00";
  const d = Math.min(10, Math.max(4, 2 - Math.floor(Math.log10(n)) + 2));
  return n.toFixed(d);
};
const fmtSol = n => {
  if (!isFinite(n) || n === 0) return "0.0000";
  if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return n.toFixed(Math.min(12, Math.max(5, 2 - Math.floor(Math.log10(n)) + 2)));
};
const vt = fn => (document.startViewTransition && !reduce) ? document.startViewTransition(fn) : fn();
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- Contract / links ---------- */
function setupContract() {
  const short = hasCA ? CA.slice(0, 6) + "..." + CA.slice(-6) : "Revealed at launch";
  $$("[data-ca-short]").forEach(el => {
    el.textContent = $("#chip").contains(el) && hasCA ? CA : short;
  });
  const buy = $("#buyBtn");
  $$("[data-buy]").forEach(a => {
    if (hasCA) { a.href = `https://jup.ag/swap/SOL-${CA}`; a.target = "_blank"; a.rel = "noopener"; }
  });
  if (!hasCA) { buy.textContent = "Buy opens at launch"; buy.setAttribute("aria-disabled", "true"); }
  $("#copyBtn").textContent = hasCA ? "Copy contract" : "Contract soon";
  $$("[data-link]").forEach(a => { a.href = CONFIG.LINKS[a.dataset.link] || "#"; });
  const copy = () => {
    if (!hasCA) return toast("Contract address is revealed at launch");
    (navigator.clipboard ? navigator.clipboard.writeText(CA) : Promise.reject())
      .then(() => toast("Contract address copied"))
      .catch(() => toast("Copy failed. Select the address manually"));
  };
  $("#copyBtn").addEventListener("click", copy);
  $$("[data-copy]").forEach(b => b.addEventListener("click", copy));
}

/* ---------- Boot sequence + entrance ---------- */
function boot() {
  let done = false;
  const go = () => {
    if (done) return; done = true;
    $("#boot").classList.add("off");
    document.body.classList.add("ready");
    setTimeout(typewriter, 700);
  };
  setTimeout(go, reduce ? 0 : 1500);
  setTimeout(go, 3000);
}
function typewriter() {
  const text = "The Solana coin for people who live on their screens.";
  const el = $("#typed");
  if (reduce) { el.textContent = text; return; }
  let i = 0;
  const id = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(id); }, 28);
}

/* ---------- Circuit canvas ---------- */
function circuit() {
  const c = $("#circuit"), ctx = c.getContext("2d");
  let W, H, paths = [], pulses = [], running = true, raf;
  const G = 48;
  const plen = p => p.reduce((a, pt, i) => i ? a + Math.abs(pt[0] - p[i - 1][0]) + Math.abs(pt[1] - p[i - 1][1]) : 0, 0);
  const at = (p, d) => {
    for (let i = 1; i < p.length; i++) {
      const l = Math.abs(p[i][0] - p[i - 1][0]) + Math.abs(p[i][1] - p[i - 1][1]);
      if (d <= l) { const t = l ? d / l : 0; return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t]; }
      d -= l;
    }
    return p[p.length - 1];
  };
  function build() {
    paths = [];
    const cols = Math.ceil(W / G), rows = Math.ceil(H / G), n = Math.max(14, Math.round(cols * rows / 12));
    for (let i = 0; i < n; i++) {
      let x = Math.floor(Math.random() * cols) * G, y = Math.floor(Math.random() * rows) * G;
      const pts = [[x, y]]; let h = Math.random() < .5;
      for (let s = 0, k = 2 + Math.floor(Math.random() * 4); s < k; s++) {
        const len = (1 + Math.floor(Math.random() * 4)) * G * (Math.random() < .5 ? -1 : 1);
        if (h) x += len; else y += len;
        x = Math.max(0, Math.min(W, x)); y = Math.max(0, Math.min(H, y));
        pts.push([x, y]); h = !h;
      }
      paths.push(pts);
    }
    pulses = paths.filter(() => Math.random() < .4).map(p => ({ p, d: Math.random() * plen(p), v: .5 + Math.random() * 1.1, L: plen(p) }));
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1.3; ctx.strokeStyle = "rgba(130,175,255,.2)"; ctx.fillStyle = "rgba(130,175,255,.45)";
    paths.forEach(p => {
      ctx.beginPath(); p.forEach((pt, i) => i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])); ctx.stroke();
      [p[0], p[p.length - 1]].forEach(pt => { ctx.beginPath(); ctx.arc(pt[0], pt[1], 3, 0, 7); ctx.fill(); });
    });
    pulses.forEach(u => {
      const [x, y] = at(u.p, u.d);
      ctx.save(); ctx.shadowColor = "#4fd8ff"; ctx.shadowBlur = 14; ctx.fillStyle = "#bff0ff";
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill(); ctx.restore();
    });
  }
  function loop() {
    if (!running) return;
    pulses.forEach(u => { u.d += u.v; if (u.d > u.L) u.d = 0; });
    draw(); raf = requestAnimationFrame(loop);
  }
  function resize() {
    const r = c.parentElement.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build(); draw();
  }
  resize();
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 200); });
  if (reduce) return;
  new IntersectionObserver(([e]) => {
    running = e.isIntersecting; cancelAnimationFrame(raf); if (running) loop();
  }).observe(c.parentElement);
}

/* ---------- Chip: tilt, drag-spin, click-flip ---------- */
function chip() {
  const wrap = $("#chipWrap"), el = $("#chip");
  let flip = 0, hx = 0, hy = 0, off = 0, drag = null;
  const apply = () => { el.style.transform = `rotateX(${hy}deg) rotateY(${hx + off + flip}deg)`; };
  wrap.addEventListener("pointermove", e => {
    if (drag) { off = (e.clientX - drag.x) * .6; }
    else { const r = wrap.getBoundingClientRect(); hx = ((e.clientX - r.left) / r.width - .5) * 26; hy = -((e.clientY - r.top) / r.height - .5) * 26; }
    apply();
  });
  wrap.addEventListener("pointerleave", () => { hx = hy = 0; if (!drag) off = 0; apply(); });
  wrap.addEventListener("pointerdown", e => { drag = { x: e.clientX }; wrap.setPointerCapture(e.pointerId); el.classList.add("dragging"); });
  const end = () => {
    if (!drag) return;
    if (Math.abs(off) < 8) flip = flip ? 0 : 180;
    drag = null; off = 0; el.classList.remove("dragging"); apply();
  };
  wrap.addEventListener("pointerup", end);
  wrap.addEventListener("pointercancel", end);
}

/* ---------- Countdown ---------- */
function launchTime() {
  if (CONFIG.LAUNCH_TIME) return new Date(CONFIG.LAUNCH_TIME).getTime();
  let t = 0;
  try { t = +localStorage.getItem("samsol_launch"); } catch (e) {}
  if (!t) { t = Date.now() + 8 * 3600e3; try { localStorage.setItem("samsol_launch", t); } catch (e) {} }
  return t;
}
let state = "pre"; // pre | launched | live
const LAUNCH = DEMO ? 0 : launchTime();
function countdown() {
  const cells = {}; $$("#count [data-u]").forEach(b => cells[b.dataset.u] = b);
  const set = (k, v) => {
    const s = String(v).padStart(2, "0");
    if (cells[k].textContent !== s) {
      cells[k].textContent = s;
      const p = cells[k].parentElement; p.classList.remove("tick"); void p.offsetWidth; p.classList.add("tick");
    }
  };
  const tick = () => {
    let ms = Math.max(0, LAUNCH - Date.now());
    const s = Math.floor(ms / 1000);
    set("d", Math.floor(s / 86400)); set("h", Math.floor(s % 86400 / 3600)); set("m", Math.floor(s % 3600 / 60)); set("s", s % 60);
    const next = ms > 0 ? "pre" : (hasCA || DEMO ? "live" : "launched");
    if (next !== state) { state = next; onState(); }
  };
  tick(); setInterval(tick, 1000);
}
function onState() {
  const hero = $("#heroStatus"), pill = $("#statusPill"), txt = $("#statusText");
  if (state === "pre") return;
  if (state === "launched") { hero.textContent = "Launched. Contract coming"; txt.textContent = "Launched, waiting for contract"; pill.classList.add("wait"); return; }
  hero.textContent = "Live on Solana"; pill.classList.remove("wait"); pill.classList.add("live");
  startPrice();
}
function initialStatus() {
  const pill = $("#statusPill"); pill.classList.add("wait");
}

/* ---------- Price ---------- */
const price = { usd: 0, sol: 0, solUsd: 0, hist: [], chg: null };
const SOL_MINT = "So11111111111111111111111111111111111111112";
function bestPair(j) {
  return ((j && j.pairs) || []).filter(p => p.chainId === "solana")
    .sort((a, b) => ((b.liquidity && b.liquidity.usd) || 0) - ((a.liquidity && a.liquidity.usd) || 0))[0];
}
async function fetchPrice() {
  if (DEMO) {
    const base = price.usd || 0.00004231, v = base * (1 + (Math.random() - .5) * .04);
    return { usd: v, solUsd: 148.2, chg: 12.4 };
  }
  const get = m => fetch(`https://api.dexscreener.com/latest/dex/tokens/${m}`).then(r => r.json());
  const [t, s] = await Promise.all([get(CA), get(SOL_MINT)]);
  const tp = bestPair(t), sp = bestPair(s);
  if (!tp || !sp) return null;
  return { usd: parseFloat(tp.priceUsd), solUsd: parseFloat(sp.priceUsd), chg: tp.priceChange ? tp.priceChange.h24 : null };
}
function render() {
  const figs = $("#figs");
  if (!price.usd) return;
  figs.classList.remove("skeleton");
  $("#usd").textContent = "$" + fmtUsd(price.usd);
  $("#sol").textContent = fmtSol(price.sol) + " SOL";
  const c = $("#chg");
  if (price.chg == null) { c.textContent = "--"; c.className = ""; }
  else { c.textContent = (price.chg >= 0 ? "+" : "") + price.chg.toFixed(2) + "%"; c.className = price.chg >= 0 ? "up" : "down"; }
  $("#statusText").textContent = "Live price";
  spark(); convert();
}
function spark() {
  const h = price.hist; if (h.length < 2) return;
  const min = Math.min(...h), max = Math.max(...h), r = max - min || 1;
  const d = h.map((v, i) => `${i ? "L" : "M"}${(i / (h.length - 1) * 200).toFixed(1)} ${(54 - (v - min) / r * 48).toFixed(1)}`).join("");
  $("#spark .line").setAttribute("d", d);
  $("#spark .flat").style.display = "none";
}
function convert() {
  const a = parseFloat($("#amount").value) || 0;
  $("#cUsd").textContent = "$" + fmtUsd(a * price.usd);
  $("#cSol").textContent = fmtSol(a * price.sol) + " SOL";
}
async function poll() {
  try {
    const r = await fetchPrice();
    if (!r) { $("#statusText").textContent = "Waiting for first trade"; return; }
    price.usd = r.usd; price.solUsd = r.solUsd; price.sol = r.usd / r.solUsd; price.chg = r.chg;
    price.hist.push(r.usd); if (price.hist.length > 40) price.hist.shift();
    render();
  } catch (e) { $("#statusText").textContent = "Price unavailable. Retrying"; }
}
let priceStarted = false;
function startPrice() {
  if (priceStarted) return; priceStarted = true;
  if (DEMO) { for (let i = 0; i < 24; i++) { price.usd = (price.usd || 0.00004231) * (1 + (Math.random() - .48) * .05); price.hist.push(price.usd); } }
  poll(); setInterval(poll, DEMO ? 3000 : CONFIG.REFRESH_MS);
}
function converter() {
  $("#amount").addEventListener("input", convert);
  $$(".chips button").forEach(b => b.addEventListener("click", () => { $("#amount").value = b.dataset.amt; convert(); }));
  convert();
}

/* ---------- Tokenomics ---------- */
function tokenomics() {
  const svg = $("#donut"), legend = $("#legend"), R = 70, C = 2 * Math.PI * R;
  const NS = "http://www.w3.org/2000/svg";
  let acc = 0;
  CONFIG.ALLOCATION.forEach((a, i) => {
    const len = Math.max(0, a.pct / 100 * C - 3);
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", 100); c.setAttribute("cy", 100); c.setAttribute("r", R);
    c.setAttribute("stroke", a.color); c.setAttribute("stroke-dasharray", `0 ${C}`);
    c.setAttribute("stroke-dashoffset", -acc); c.dataset.len = len; c.dataset.c = C; c.dataset.i = i;
    svg.appendChild(c); acc += a.pct / 100 * C;
    const li = document.createElement("li");
    li.innerHTML = `<span class="hl"></span><i style="background:${a.color}"></i><span>${a.name}</span><em>${a.pct}%</em>`;
    li.dataset.i = i; legend.appendChild(li);
  });
  const select = i => vt(() => {
    $$("circle", svg).forEach(c => c.classList.toggle("sel", +c.dataset.i === i));
    svg.classList.add("dim");
    $$("li", legend).forEach(l => l.classList.toggle("active", +l.dataset.i === i));
    $("#tkPct").textContent = CONFIG.ALLOCATION[i].pct + "%";
    $("#tkName").textContent = CONFIG.ALLOCATION[i].name;
  });
  legend.addEventListener("click", e => { const l = e.target.closest("li"); if (l) select(+l.dataset.i); });
  legend.addEventListener("pointerover", e => { const l = e.target.closest("li"); if (l && !l.classList.contains("active") && e.pointerType === "mouse") select(+l.dataset.i); });
  svg.addEventListener("click", e => { if (e.target.dataset.i) select(+e.target.dataset.i); });
  new IntersectionObserver((es, o) => es.forEach(e => {
    if (!e.isIntersecting) return; o.disconnect();
    $$("circle", svg).forEach((c, k) => setTimeout(() => c.setAttribute("stroke-dasharray", `${c.dataset.len} ${C}`), k * 150));
    setTimeout(() => select(0), 900);
  }), { threshold: .4 }).observe(svg);
}

/* ---------- Reveal, counters, progress, parallax ---------- */
function scrollFx() {
  $$("[data-stagger]").forEach(s => [...s.children].forEach((c, i) => c.style.setProperty("--k", i)));
  const io = new IntersectionObserver((es, o) => es.forEach(e => {
    if (!e.isIntersecting) return; e.target.classList.add("in"); o.unobserve(e.target);
    if (e.target.querySelector("[data-count-supply]")) count($("[data-count-supply]"), CONFIG.SUPPLY);
  }), { threshold: .18 });
  $$("[data-reveal],[data-stagger]").forEach(el => io.observe(el));
  const bar = $("#progress"), wrap = $("#chipWrap");
  let tick = false;
  addEventListener("scroll", () => {
    if (tick) return; tick = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      if (!reduce && scrollY < innerHeight) wrap.style.translate = `0 ${scrollY * .18}px`;
      tick = false;
    });
  }, { passive: true });
}
function count(el, to) {
  if (reduce) { el.textContent = to.toLocaleString("en-US"); return; }
  const t0 = performance.now(), dur = 1600;
  const step = t => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
    el.textContent = Math.round(to * e).toLocaleString("en-US");
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- Hover + click effects ---------- */
function interactions() {
  // glow follows cursor
  $$(".spot").forEach(el => el.addEventListener("pointermove", e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", e.clientX - r.left + "px"); el.style.setProperty("--my", e.clientY - r.top + "px");
  }));
  // magnetic buttons
  if (!reduce && matchMedia("(hover:hover)").matches) {
    $$(".magnetic").forEach(b => {
      b.addEventListener("pointermove", e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
  }
  // click ripple
  $$(".btn").forEach(b => b.addEventListener("click", e => {
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), i = document.createElement("span");
    i.className = "rip"; i.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.appendChild(i); setTimeout(() => i.remove(), 700);
    if (b.getAttribute("aria-disabled") === "true") { e.preventDefault(); toast("Buying opens when the contract is live"); }
  }));
}

/* ---------- Roadmap: drag to scroll, click to expand ---------- */
function roadmap() {
  const tr = $("#track");
  let down = false, sx = 0, sl = 0, moved = 0;
  tr.addEventListener("pointerdown", e => { if (e.pointerType === "touch") return; down = true; moved = 0; sx = e.clientX; sl = tr.scrollLeft; tr.classList.add("grabbing"); });
  addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); tr.scrollLeft = sl - dx; });
  addEventListener("pointerup", () => { down = false; tr.classList.remove("grabbing"); });
  const toggle = p => { if (moved > 6) return; const open = p.getAttribute("aria-expanded") === "true"; p.setAttribute("aria-expanded", String(!open)); };
  $$(".phase", tr).forEach(p => {
    p.addEventListener("click", () => toggle(p));
    p.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); moved = 0; toggle(p); } });
  });
}

/* ---------- Init ---------- */
setupContract();
initialStatus();
boot();
circuit();
chip();
countdown();
converter();
tokenomics();
scrollFx();
interactions();
roadmap();
