"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./uaenational.module.css";

const W = 1080;
const H = 1080;
const NAVY = "#152C3A";
const GOLD = "#E0A93E";
const GOLD_DARK = "#C8891E";
const INK = "#3B4D59";
const STORAGE_KEY = "dre-oh-agent";

// Material-style icon paths (24x24 viewbox) drawn with Path2D.
const ICONS = {
  calendar:
    "M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z",
  clock:
    "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
  pin: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  check:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  phone:
    "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
};

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

function drawIcon(
  ctx: CanvasRenderingContext2D,
  d: string,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(d));
  ctx.restore();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s,
    sh = h / s;
  const sx = (img.width - sw) / 2,
    sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// Load the fonts the flyer needs into the document so canvas can use them.
async function ensureFonts(): Promise<void> {
  const cssUrls = [
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap",
    "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap",
  ];
  for (const cssUrl of cssUrls) {
    try {
      const css = await (await fetch(cssUrl)).text();
      const re = /@font-face\s*{([^}]*)}/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(css)) !== null) {
        const block = m[1];
        const fam = block.match(/font-family:\s*'([^']+)'/)?.[1];
        const weight = block.match(/font-weight:\s*(\d+)/)?.[1] || "400";
        const url = block.match(/url\((https:[^)]+)\)/)?.[1];
        if (!fam || !url) continue;
        const face = new FontFace(fam, `url(${url})`, { weight });
        await face.load();
        document.fonts.add(face);
      }
    } catch {}
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawFlyer(
  ctx: CanvasRenderingContext2D,
  o: {
    banner: HTMLImageElement | null;
    logo: HTMLImageElement | null;
    photo: HTMLImageElement | null;
    name: string;
    title: string;
    phone: string;
  }
) {
  const { banner, logo, photo, name, title, phone } = o;
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  const M = 72; // outer margin

  // Hero image — top portion, covered.
  const heroH = 480;
  if (banner) drawCover(ctx, banner, 0, 0, W, heroH);
  else {
    const g = ctx.createLinearGradient(0, 0, W, heroH);
    g.addColorStop(0, "#BCD7E4");
    g.addColorStop(1, "#EAF3F7");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, heroH);
  }

  // Left-to-right white veil so the headline stays legible over the photo.
  const veil = ctx.createLinearGradient(0, 0, W, 0);
  veil.addColorStop(0, "rgba(255,255,255,0.96)");
  veil.addColorStop(0.5, "rgba(255,255,255,0.8)");
  veil.addColorStop(0.85, "rgba(255,255,255,0)");
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, W, heroH);

  // Fade hero into the white content area.
  const fade = ctx.createLinearGradient(0, heroH - 140, 0, heroH + 40);
  fade.addColorStop(0, "rgba(255,255,255,0)");
  fade.addColorStop(1, "rgba(255,255,255,1)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, heroH - 140, W, 180);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Logo
  if (logo) {
    const lh = 62;
    const lw = (logo.width / logo.height) * lh;
    ctx.drawImage(logo, M, 46, lw, lh);
  } else {
    ctx.fillStyle = NAVY;
    ctx.font = "700 46px Inter, Arial, sans-serif";
    ctx.fillText("dre", M, 96);
  }

  // Headline stack
  ctx.fillStyle = NAVY;
  ctx.font = "400 108px 'Great Vibes', 'Segoe Script', cursive";
  ctx.fillText("Welcome", M, 208);

  ctx.font = "600 36px Inter, Arial, sans-serif";
  ctx.fillText("to the DRE Homes", M + 6, 266);

  ctx.font = "800 92px Inter, Arial, sans-serif";
  ctx.fillText("Open House", M, 362);

  ctx.font = "400 35px Inter, Arial, sans-serif";
  ctx.fillStyle = INK;
  ctx.fillText("Explore Residential & Commercial Properties", M, 424);
  ctx.fillText("Starting from", M, 470);

  // Price pill (gold)
  const pillY = 496,
    pillW = 520,
    pillH = 88;
  const pillG = ctx.createLinearGradient(M, pillY, M, pillY + pillH);
  pillG.addColorStop(0, GOLD);
  pillG.addColorStop(1, GOLD_DARK);
  ctx.fillStyle = pillG;
  rr(ctx, M, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.font = "800 50px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("AED 550,000", M + pillW / 2, pillY + 62);
  ctx.textAlign = "left";

  // Event details — two clear columns on row 1, address on row 2.
  const dY = 666;
  const iconS = 38;
  // Column 1: date
  drawIcon(ctx, ICONS.calendar, M, dY - 33, iconS, NAVY);
  ctx.fillStyle = NAVY;
  ctx.font = "700 36px Inter, Arial, sans-serif";
  ctx.fillText("Wednesday, 2 December 2026", M + 58, dY);
  // Column 2: time (fixed x so it can't collide with the date)
  drawIcon(ctx, ICONS.clock, 730, dY - 33, iconS, NAVY);
  ctx.fillText("10 AM onwards", 788, dY);

  // Address
  const aY = dY + 64;
  drawIcon(ctx, ICONS.pin, M, aY - 31, iconS, NAVY);
  ctx.font = "600 31px Inter, Arial, sans-serif";
  ctx.fillStyle = INK;
  ctx.fillText("DRE, Office 401, Park Heights Square 2,", M + 58, aY);
  ctx.fillText("Dubai Hills Estate, Dubai.", M + 58, aY + 42);

  // Gold divider
  const divY = aY + 82;
  const dg = ctx.createLinearGradient(M, 0, W - M, 0);
  dg.addColorStop(0, GOLD);
  dg.addColorStop(1, "rgba(224,169,62,0)");
  ctx.fillStyle = dg;
  ctx.fillRect(M, divY, W - M * 2, 3);

  // Deals heading
  const dealsY = divY + 66;
  ctx.fillStyle = NAVY;
  ctx.font = "800 42px Inter, Arial, sans-serif";
  ctx.fillText("Discover Exclusive Deals", M, dealsY);

  // Perks row — measured so items never run into the margin.
  const perksY = dealsY + 58;
  const perks = [
    "Special Discounts",
    "Flexible Payment Plans",
    "Cashback Offers",
  ];
  const pFont = "600 27px Inter, Arial, sans-serif";
  ctx.font = pFont;
  const widths = perks.map((p) => ctx.measureText(p).width);
  const iconGap = 44,
    sepGap = 52;
  const total =
    widths.reduce((a, b) => a + b, 0) +
    perks.length * iconGap +
    (perks.length - 1) * sepGap;
  let px = Math.max(M, (W - total) / 2);
  perks.forEach((perk, i) => {
    drawIcon(ctx, ICONS.check, px, perksY - 25, 32, GOLD_DARK);
    ctx.fillStyle = NAVY;
    ctx.font = pFont;
    ctx.fillText(perk, px + iconGap, perksY);
    px += iconGap + widths[i] + sepGap;
    if (i < perks.length - 1) {
      ctx.fillStyle = "#C9D5DB";
      ctx.fillRect(px - sepGap / 2 - 1, perksY - 27, 2, 34);
    }
  });

  // Bottom navy band with gold top edge
  const bandY = 962;
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, bandY, W, H - bandY);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, bandY, W, 4);

  // Agent photo circle
  const cx = 124,
    cy = bandY + 59,
    r = 50;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (photo) drawCover(ctx, photo, cx - r, cy - r, r * 2, r * 2);
  else {
    ctx.fillStyle = "#28495C";
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = "#B8C6CF";
    ctx.beginPath();
    ctx.arc(cx, cy - 11, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy + 40, 34, Math.PI, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.stroke();

  // Agent details (left column) — vertically centred in the band.
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 38px Inter, Arial, sans-serif";
  ctx.fillText(name || "Your Name", 222, bandY + 56);
  ctx.fillStyle = "#B8C6CF";
  ctx.font = "400 27px Inter, Arial, sans-serif";
  ctx.fillText(title || "Real Estate Consultant", 222, bandY + 96);

  // Phone + tagline (right column)
  ctx.textAlign = "right";
  if (phone) {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 34px Inter, Arial, sans-serif";
    const tw = ctx.measureText(phone).width;
    drawIcon(ctx, ICONS.phone, W - M - tw - 50, bandY + 24, 34, GOLD);
    ctx.fillText(phone, W - M, bandY + 56);
  }
  ctx.fillStyle = "#B8C6CF";
  ctx.font = "italic 400 24px Inter, Arial, sans-serif";
  ctx.fillText("Meet our expert property advisors", W - M, bandY + 88);
  ctx.fillText("and find your ideal investment in Dubai!", W - M, bandY + 112);
  ctx.textAlign = "left";
}

export default function FlyerBuilder() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bannerRef = useRef<HTMLImageElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function toast(msg: string) {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600);
  }

  // Load remembered agent details shared with the email builder.
  useEffect(() => {
    try {
      const o = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (o.agentEn) setName(o.agentEn);
      if (o.title) setTitle(o.title);
      if (o.phone) setPhone(o.phone);
    } catch {}
  }, []);

  // Persist agent details back to the shared key.
  useEffect(() => {
    try {
      const o = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      o.agentEn = name;
      o.title = title;
      o.phone = phone;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
    } catch {}
  }, [name, title, phone]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawFlyer(ctx, {
      banner: bannerRef.current,
      logo: logoRef.current,
      photo,
      name,
      title,
      phone,
    });
  }, [photo, name, title, phone]);

  useEffect(() => {
    let alive = true;
    (async () => {
      await ensureFonts();
      try {
        bannerRef.current = await loadImage("/uaenational/banner.jpg");
      } catch {}
      try {
        logoRef.current = await loadImage("/uaenational/dre-logo.png");
      } catch {}
      if (alive) redraw();
    })();
    return () => {
      alive = false;
    };
  }, [redraw]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setPhoto(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dre-open-house-invite.png";
      a.click();
      URL.revokeObjectURL(url);
      toast("Image downloaded.");
    }, "image/png");
  }

  return (
    <div className={styles.wrap}>
      <aside className={styles.panel} aria-label="Flyer settings">
        <div className={styles.step}>Your details</div>
        <label htmlFor="flyerName">Your name</label>
        <input
          type="text"
          id="flyerName"
          placeholder="e.g. Fariba Dolatabadi"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label htmlFor="flyerTitle">Job title</label>
        <input
          type="text"
          id="flyerTitle"
          placeholder="e.g. Real Estate Consultant"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label htmlFor="flyerPhone">Mobile / WhatsApp</label>
        <input
          type="tel"
          id="flyerPhone"
          placeholder="+971 5X XXX XXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <p className={styles.hint}>
          Your details are remembered on this device for next time.
        </p>

        <div className={styles.step}>Your photo</div>
        <label className={styles.fileBtn} htmlFor="flyerPhoto">
          {photo ? "Change photo" : "Upload photo"}
        </label>
        <input
          type="file"
          id="flyerPhoto"
          accept="image/*"
          className={styles.fileInput}
          onChange={onPhoto}
        />
        <p className={styles.hint}>
          A square, chest-up photo works best — it is cropped into a circle.
        </p>

        <div className={styles.step}>Download</div>
        <button
          className={`${styles.btn} ${styles.primary}`}
          type="button"
          onClick={download}
          style={{ width: "100%" }}
        >
          Download PNG (1080 × 1080)
        </button>
        <p className={styles.hint}>
          Sized for WhatsApp, Instagram and email signatures.
        </p>
      </aside>

      <main className={styles.main}>
        <div className={styles.stage}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className={styles.flyerCanvas}
            aria-label="Open House invite preview"
          />
        </div>
      </main>
      <div
        className={`${styles.toast} ${toastMsg ? styles.show : ""}`}
        role="status"
        aria-live="polite"
      >
        {toastMsg}
      </div>
    </div>
  );
}
