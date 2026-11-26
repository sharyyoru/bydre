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

  // Hero image — top portion, covered.
  const heroH = 500;
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
  veil.addColorStop(0, "rgba(255,255,255,0.95)");
  veil.addColorStop(0.55, "rgba(255,255,255,0.72)");
  veil.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, W, heroH);

  // Fade hero into the white content area.
  const fade = ctx.createLinearGradient(0, heroH - 140, 0, heroH + 30);
  fade.addColorStop(0, "rgba(255,255,255,0)");
  fade.addColorStop(1, "rgba(255,255,255,1)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, heroH - 140, W, 170);

  ctx.textBaseline = "alphabetic";

  // Logo
  if (logo) {
    const lh = 72;
    const lw = (logo.width / logo.height) * lh;
    ctx.drawImage(logo, 60, 42, lw, lh);
  } else {
    ctx.fillStyle = NAVY;
    ctx.font = "700 50px Inter, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("dre", 60, 98);
  }

  // Headline stack
  ctx.fillStyle = NAVY;
  ctx.textAlign = "left";
  ctx.font = "400 112px 'Great Vibes', 'Segoe Script', cursive";
  ctx.fillText("Welcome", 60, 204);

  ctx.font = "700 40px Inter, Arial, sans-serif";
  ctx.fillText("to the DRE Homes", 66, 270);

  ctx.font = "800 100px Inter, Arial, sans-serif";
  ctx.fillText("Open House", 60, 374);

  ctx.font = "400 38px Inter, Arial, sans-serif";
  ctx.fillStyle = INK;
  ctx.fillText("Explore Residential & Commercial Properties", 64, 432);
  ctx.fillText("Starting from", 64, 480);

  // Price pill (gold)
  const pillY = 504,
    pillW = 540,
    pillH = 88;
  const pillG = ctx.createLinearGradient(60, pillY, 60, pillY + pillH);
  pillG.addColorStop(0, GOLD);
  pillG.addColorStop(1, GOLD_DARK);
  ctx.fillStyle = pillG;
  rr(ctx, 60, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.font = "800 54px Inter, Arial, sans-serif";
  ctx.fillText("AED 550,000", 60 + 40, pillY + 62);

  // Event details (below hero, on white)
  let y = 664;
  ctx.fillStyle = NAVY;
  drawIcon(ctx, ICONS.calendar, 64, y - 32, 40, NAVY);
  ctx.font = "700 38px Inter, Arial, sans-serif";
  ctx.fillText("Wednesday, 2 December 2026", 124, y);

  drawIcon(ctx, ICONS.clock, 660, y - 32, 40, NAVY);
  ctx.font = "700 38px Inter, Arial, sans-serif";
  ctx.fillText("10 AM onwards", 720, y);

  y += 62;
  drawIcon(ctx, ICONS.pin, 64, y - 30, 40, NAVY);
  ctx.font = "600 32px Inter, Arial, sans-serif";
  ctx.fillStyle = INK;
  ctx.fillText("DRE, Office 401, Park Heights Square 2,", 124, y);
  ctx.fillText("Dubai Hills Estate, Dubai.", 124, y + 42);

  // Gold divider
  y += 78;
  const dg = ctx.createLinearGradient(64, 0, W - 64, 0);
  dg.addColorStop(0, GOLD);
  dg.addColorStop(1, "rgba(224,169,62,0)");
  ctx.fillStyle = dg;
  ctx.fillRect(64, y, W - 128, 3);

  // Deals line
  y += 60;
  ctx.fillStyle = NAVY;
  ctx.font = "800 44px Inter, Arial, sans-serif";
  ctx.fillText("Discover Exclusive Deals", 64, y);

  y += 56;
  const perks = [
    "Special Discounts",
    "Flexible Payment Plans",
    "Cashback Offers",
  ];
  let px = 64;
  ctx.font = "600 28px Inter, Arial, sans-serif";
  perks.forEach((perk, i) => {
    drawIcon(ctx, ICONS.check, px, y - 26, 34, GOLD_DARK);
    ctx.fillStyle = NAVY;
    ctx.fillText(perk, px + 44, y);
    px += ctx.measureText(perk).width + 96;
    if (i < perks.length - 1) {
      ctx.fillStyle = "#C9D5DB";
      ctx.fillRect(px - 48, y - 30, 2, 36);
    }
  });

  // Bottom navy band with gold top edge
  const bandY = 950;
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, bandY, W, H - bandY);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, bandY, W, 4);

  // Agent photo circle
  const cx = 130,
    cy = bandY + 66,
    r = 56;
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
    ctx.arc(cx, cy - 12, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy + 44, 38, Math.PI, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.stroke();

  // Agent details
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.font = "700 40px Inter, Arial, sans-serif";
  ctx.fillText(name || "Your Name", 228, bandY + 62);
  ctx.fillStyle = "#B8C6CF";
  ctx.font = "400 30px Inter, Arial, sans-serif";
  ctx.fillText(title || "Real Estate Consultant", 228, bandY + 104);

  // Phone + tagline (right)
  ctx.textAlign = "right";
  if (phone) {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 36px Inter, Arial, sans-serif";
    const tw = ctx.measureText(phone).width;
    drawIcon(ctx, ICONS.phone, W - 56 - tw - 52, bandY + 30, 36, GOLD);
    ctx.fillText(phone, W - 56, bandY + 62);
  }
  ctx.fillStyle = "#B8C6CF";
  ctx.font = "italic 400 26px Inter, Arial, sans-serif";
  ctx.fillText("Meet our expert property advisors", W - 56, bandY + 100);
  ctx.fillText("and find your ideal investment in Dubai!", W - 56, bandY + 126);
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
