// Email builder for the DRE Eid Al Etihad Open House RSVP confirmation.
// Ported from reference/index.html — output must stay a table-based HTML
// string with inline styles so it survives pasting into Gmail/Outlook.

const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://bydre.vercel.app";
export const BANNER_URL = `${ORIGIN}/uaenational/banner.jpg`;
export const LOGO_URL = `${ORIGIN}/uaenational/dre-logo.png`;

const MAP =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("DRE Park Heights Square 2 Dubai Hills Estate");
const CAL =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" +
  encodeURIComponent("DRE Open House – Eid Al Etihad") +
  "&dates=20261202T060000Z/20261202T140000Z&details=" +
  encodeURIComponent(
    "DRE Eid Al Etihad Open House. Offers exclusive to UAE Nationals."
  ) +
  "&location=" +
  encodeURIComponent(
    "DRE Headquarters, Park Heights Square 2, Dubai Hills Estate, Dubai"
  );

const NAVY = "#152C3A",
  INK = "#3B4D59",
  MUTED = "#5A6973",
  LINE = "#DCE6EA",
  RED = "#C52D44",
  GREEN = "#00843D";
const FONT = {
  ar: "Tahoma,'Segoe UI',Arial,sans-serif",
  en: "Arial,Helvetica,sans-serif",
} as const;

type Lang = "ar" | "en";
export type UaeNationalLang = Lang | "both";

export interface UaeNationalState {
  lang: UaeNationalLang;
  clientAr: string;
  clientEn: string;
  agentAr: string;
  agentEn: string;
  title: string;
  phone: string;
  mail: string;
  noteAr: string;
  noteEn: string;
  offers: boolean;
  bring: boolean;
  buttons: boolean;
  images: boolean;
}

const T = {
  ar: {
    pill: "✓ تم تأكيد حضوركم",
    eyebrow: "اليوم المفتوح · عيد الاتحاد",
    headline: "مفتاحك في وطنك",
    greet: (n: string) => (n ? `مرحباً ${n}،` : "مرحباً،"),
    body: "شكراً لتأكيد حضوركم اليوم المفتوح الذي تقيمه DRE احتفالاً بعيد الاتحاد. يسعدني استقبالكم شخصياً في مقرنا الرئيسي، وتقديم أفضل الفرص العقارية لكم بعروض حصرية لمواطني الدولة.",
    details: [
      ["التاريخ", "الأربعاء 2 ديسمبر 2026"],
      ["الوقت", "من الساعة 10 صباحاً"],
      [
        "المكان",
        'مقر DRE الرئيسي<br><span style="font-weight:400;color:' +
          MUTED +
          ';">بارك هايتس سكوير 2، دبي هيلز استيت</span>',
      ],
    ],
    offersTitle: "بانتظاركم يوم الفعالية",
    offers: [
      ["550 ألف درهم", "عقارات تبدأ من"],
      ["سكني وتجاري", "مشاريع متنوعة"],
      ["سداد مرن", "خطط دفع ميسّرة"],
      ["عروض حصرية", "لمواطني الدولة، يوم الفعالية فقط"],
    ],
    bringTitle: "قبل الحضور",
    bring: [
      "يرجى إحضار الهوية الإماراتية للاستفادة من العروض الحصرية.",
      "يسعدنا حضور أفراد العائلة معكم.",
    ],
    bDir: "الاتجاهات إلى المقر",
    bCal: "أضف إلى التقويم",
    bWa: "تواصل معي عبر واتساب",
    close: "نتشرف بلقائكم يوم الأربعاء.",
    regards: "مع أطيب التحيات،",
    footer:
      "DRE · بارك هايتس سكوير 2، دبي هيلز استيت، دبي، الإمارات العربية المتحدة",
    subject:
      "تأكيد حضوركم | اليوم المفتوح من DRE احتفالاً بعيد الاتحاد – 2 ديسمبر",
    waMsg: "مرحباً، بخصوص اليوم المفتوح من DRE يوم 2 ديسمبر",
  },
  en: {
    pill: "✓ You're confirmed",
    eyebrow: "Eid Al Etihad Open House",
    headline: "Your Key, Your Homeland",
    greet: (n: string) => (n ? `Dear ${n},` : "Hello,"),
    body: "Thank you for confirming your attendance at DRE's Eid Al Etihad Open House. I look forward to welcoming you personally at our headquarters and walking you through the best opportunities, with offers exclusive to UAE Nationals.",
    details: [
      ["Date", "Wednesday, 2 December 2026"],
      ["Time", "From 10am"],
      [
        "Venue",
        'DRE Headquarters<br><span style="font-weight:400;color:' +
          MUTED +
          ';">Park Heights Square 2, Dubai Hills Estate</span>',
      ],
    ],
    offersTitle: "Waiting for you on the day",
    offers: [
      ["AED 550K", "Properties from"],
      ["Residential &amp; commercial", "A wide choice of projects"],
      ["Flexible plans", "Easy payment options"],
      ["Exclusive offers", "For UAE Nationals, on the day only"],
    ],
    bringTitle: "Before you come",
    bring: [
      "Please bring your Emirates ID to access the exclusive offers.",
      "Family members are very welcome to join you.",
    ],
    bDir: "Get directions",
    bCal: "Add to calendar",
    bWa: "WhatsApp me",
    close: "I look forward to seeing you on Wednesday.",
    regards: "Warm regards,",
    footer: "DRE · Park Heights Square 2, Dubai Hills Estate, Dubai, UAE",
    subject: "You're confirmed: DRE Eid Al Etihad Open House, 2 December",
    waMsg: "Hi, regarding the DRE Open House on 2 December",
  },
} as const;

function esc(s: string): string {
  return (s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] as string
  );
}
function para(s: string): string {
  return esc(s).replace(/\n/g, "<br>");
}
function waLink(phone: string, msg: string): string {
  const d = (phone || "").replace(/\D/g, "");
  return d ? `https://wa.me/${d}?text=${encodeURIComponent(msg)}` : "";
}

interface POpts {
  size?: number;
  lh?: number;
  color?: string;
  w?: number;
  mt?: number;
  mb?: number;
  extra?: string;
}
function P(t: string, l: Lang, o: POpts = {}): string {
  const { size = 15, lh = 24, color = INK, w = 400, mt = 0, mb = 0, extra = "" } = o;
  return `<p style="margin:${mt}px 0 ${mb}px 0;font-family:${FONT[l]};font-size:${size}px;line-height:${lh}px;font-weight:${w};color:${color};${extra}">${t}</p>`;
}

function button(label: string, href: string, l: Lang, primary: boolean): string {
  const bg = primary ? GREEN : "#FFFFFF",
    fg = primary ? "#FFFFFF" : NAVY,
    bd = primary ? GREEN : "#C9D5DB";
  return `<td style="padding:0 4px 8px 4px;"><a href="${href}" target="_blank" style="display:inline-block;padding:12px 20px;border-radius:999px;background:${bg};border:1px solid ${bd};color:${fg};font-family:${FONT[l]};font-size:14px;line-height:18px;font-weight:700;text-decoration:none;white-space:nowrap;">${label}</a></td>`;
}

function section(l: Lang, st: UaeNationalState): string {
  const t = T[l],
    dir = l === "ar" ? "rtl" : "ltr",
    al = l === "ar" ? "right" : "left";
  const client = l === "ar" ? st.clientAr.trim() : st.clientEn.trim();
  const agent =
    (l === "ar" ? st.agentAr.trim() : "") ||
    st.agentEn.trim() ||
    st.agentAr.trim();
  const note = (l === "ar" ? st.noteAr : st.noteEn).trim();
  let h = `<tr><td dir="${dir}" style="padding:26px 32px 0 32px;text-align:${al};">`;
  h += `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${al}"><tr><td style="background:#E6F3EC;border-radius:999px;padding:6px 14px;font-family:${FONT[l]};font-size:13px;line-height:18px;font-weight:700;color:${GREEN};">${t.pill}</td></tr></table>`;
  h += `<div style="clear:both;height:14px;line-height:14px;font-size:0;">&nbsp;</div>`;
  h += P(t.eyebrow, l, {
    size: 12,
    lh: 18,
    color: RED,
    w: 700,
    mb: 6,
    extra: l === "en" ? "letter-spacing:1.5px;text-transform:uppercase;" : "",
  });
  h += P(t.headline, l, { size: 30, lh: 38, color: NAVY, w: 700, mb: 18 });
  h += P(t.greet(esc(client)), l, {
    size: 16,
    lh: 24,
    color: NAVY,
    w: 700,
    mb: 10,
  });
  h += P(t.body, l, { size: 15, lh: 25, mb: 0 });
  if (note) {
    const side = l === "ar" ? "border-right" : "border-left";
    h += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;"><tr><td dir="${dir}" style="background:#F3F7F9;${side}:3px solid ${GREEN};border-radius:6px;padding:14px 16px;text-align:${al};">${P(
      para(note),
      l,
      { size: 15, lh: 24, color: NAVY }
    )}</td></tr></table>`;
  }
  h += `</td></tr>`;
  // details
  h += `<tr><td dir="${dir}" style="padding:20px 32px 0 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${LINE};border-radius:10px;background:#FFFFFF;">`;
  t.details.forEach(([k, v], i) => {
    const bt = i ? `border-top:1px solid ${LINE};` : "";
    h += `<tr><td width="28%" valign="top" style="${bt}padding:12px 16px;text-align:${al};font-family:${FONT[l]};font-size:12px;line-height:20px;font-weight:700;color:#8394A0;${
      l === "en" ? "text-transform:uppercase;letter-spacing:1px;" : ""
    }">${k}</td><td valign="top" style="${bt}padding:12px 16px;text-align:${al};font-family:${
      FONT[l]
    };font-size:15px;line-height:22px;font-weight:700;color:${NAVY};">${v}</td></tr>`;
  });
  h += `</table></td></tr>`;
  // offers
  if (st.offers) {
    h +=
      `<tr><td dir="${dir}" style="padding:22px 26px 0 26px;text-align:${al};">` +
      P(t.offersTitle, l, {
        size: 17,
        lh: 24,
        color: NAVY,
        w: 700,
        mb: 10,
        extra: "padding:0 6px;",
      });
    h += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">`;
    for (let i = 0; i < 4; i += 2) {
      h += `<tr>`;
      [i, i + 1].forEach((j) => {
        const [big, small] = t.offers[j],
          hi = j === 3;
        const bg = hi ? RED : "#FFFFFF",
          bd = hi ? RED : "#F0C9CF",
          c1 = hi ? "#FFFFFF" : RED,
          c2 = hi ? "#FFFFFF" : INK;
        h +=
          `<td width="50%" valign="top" style="padding:0 6px 12px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bg};border:1px solid ${bd};border-radius:10px;"><tr><td dir="${dir}" style="padding:14px 16px;text-align:${al};">` +
          (l === "ar"
            ? P(small, l, { size: 13, lh: 19, color: c2 }) +
              P(big, l, { size: 18, lh: 25, color: c1, w: 700, mt: 2 })
            : P(small, l, { size: 13, lh: 19, color: c2 }) +
              P(big, l, { size: 18, lh: 24, color: c1, w: 700, mt: 2 })) +
          `</td></tr></table></td>`;
      });
      h += `</tr>`;
    }
    h += `</table></td></tr>`;
  }
  // bring
  if (st.bring) {
    h +=
      `<tr><td dir="${dir}" style="padding:12px 32px 0 32px;text-align:${al};">` +
      P(t.bringTitle, l, { size: 17, lh: 24, color: NAVY, w: 700, mb: 8 });
    t.bring.forEach((b) => {
      h += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="26" valign="top" style="padding:2px 0 8px 0;font-family:Arial,sans-serif;font-size:15px;line-height:22px;font-weight:700;color:${GREEN};">✓</td><td dir="${dir}" valign="top" style="padding:2px 0 8px 0;text-align:${al};">${P(
        b,
        l,
        { size: 15, lh: 22 }
      )}</td></tr></table>`;
    });
    h += `</td></tr>`;
  }
  // buttons
  if (st.buttons) {
    const wa = waLink(st.phone, t.waMsg);
    h +=
      `<tr><td dir="${dir}" align="center" style="padding:18px 28px 0 28px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>` +
      button(t.bDir, MAP, l, true) +
      button(t.bCal, CAL, l, false) +
      (wa ? button(t.bWa, wa, l, false) : "") +
      `</tr></table></td></tr>`;
  }
  // sign-off
  const title = esc(st.title.trim()),
    phone = esc(st.phone.trim()),
    mail = esc(st.mail.trim());
  let sig =
    P(t.close, l, { size: 15, lh: 24, mb: 14 }) +
    P(t.regards, l, { size: 15, lh: 24, mb: 4 });
  sig += P(esc(agent) || (l === "ar" ? "اسم الوكيل" : "Your name"), l, {
    size: 16,
    lh: 24,
    color: NAVY,
    w: 700,
  });
  sig += P([title, "DRE"].filter(Boolean).join(" · "), l, {
    size: 14,
    lh: 21,
    color: MUTED,
  });
  const contact = [
    phone ? `<span dir="ltr">${phone}</span>` : "",
    mail
      ? `<a href="mailto:${mail}" style="color:${GREEN};text-decoration:none;">${mail}</a>`
      : "",
  ]
    .filter(Boolean)
    .join(" &nbsp;·&nbsp; ");
  if (contact) sig += P(contact, l, { size: 14, lh: 21, color: NAVY, mt: 2 });
  h += `<tr><td dir="${dir}" style="padding:24px 32px 28px 32px;text-align:${al};">${sig}</td></tr>`;
  return h;
}

export function buildEmail(st: UaeNationalState): string {
  const langs: Lang[] = st.lang === "both" ? ["ar", "en"] : [st.lang];
  const dir0 = langs[0] === "ar" ? "rtl" : "ltr";
  let h = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F8FA;"><tr><td align="center" style="padding:20px 8px;">`;
  h += `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid ${LINE};border-radius:14px;overflow:hidden;">`;
  h +=
    `<tr><td style="font-size:0;line-height:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
    ["#C8102E", "#00843D", "#FFFFFF", "#000000"]
      .map(
        (c) =>
          `<td width="25%" height="5" style="background:${c};font-size:0;line-height:0;">&nbsp;</td>`
      )
      .join("") +
    `</tr></table></td></tr>`;
  // header
  const right =
    langs.length > 1
      ? "عيد الاتحاد · Eid Al Etihad"
      : langs[0] === "ar"
        ? "عيد الاتحاد · 2 ديسمبر"
        : "Eid Al Etihad · 2 Dec";
  const logo = st.images
    ? `<img src="${LOGO_URL}" width="74" alt="DRE" style="display:block;width:74px;height:auto;border:0;">`
    : `<span style="font-family:Arial,sans-serif;font-size:24px;font-weight:700;color:${NAVY};letter-spacing:-0.5px;">dre</span>`;
  h +=
    `<tr><td dir="${dir0}" style="padding:18px 32px;border-bottom:1px solid ${LINE};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
    `<td dir="${dir0}" align="${dir0 === "rtl" ? "right" : "left"}" valign="middle">${logo}</td>` +
    `<td dir="${dir0}" align="${dir0 === "rtl" ? "left" : "right"}" valign="middle" style="font-family:${
      FONT[langs[0]]
    };font-size:13px;line-height:18px;color:${MUTED};">${right}</td></tr></table></td></tr>`;
  if (st.images)
    h += `<tr><td style="font-size:0;line-height:0;"><img src="${BANNER_URL}" width="600" alt="Burj Khalifa wrapped in the UAE flag" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>`;
  langs.forEach((l, i) => {
    if (i)
      h += `<tr><td style="padding:0 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px dashed #C9D5DB;font-size:0;line-height:0;height:1px;">&nbsp;</td></tr></table></td></tr>`;
    h += section(l, st);
  });
  h +=
    `<tr><td style="background:${NAVY};padding:16px 32px;text-align:center;">` +
    langs
      .map((l) => P(T[l].footer, l, { size: 12, lh: 18, color: "#B8C6CF" }))
      .join("") +
    `</td></tr>`;
  h += `</table></td></tr></table>`;
  return h;
}

export function emailSubject(lang: UaeNationalLang): string {
  return lang === "both"
    ? "تأكيد حضوركم | You're confirmed – DRE Eid Al Etihad Open House, 2 Dec"
    : T[lang].subject;
}

export function fullDoc(st: UaeNationalState): string {
  return `<!DOCTYPE html><html lang="${st.lang === "ar" ? "ar" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(
    emailSubject(st.lang)
  )}</title></head><body style="margin:0;padding:0;background:#F4F8FA;">${buildEmail(st)}</body></html>`;
}
