// Compare the ported email builder (src/lib/uae-national-email.ts) against the
// reference implementation in reference/index.html byte-for-byte, minus the
// intended absolute image URLs.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";
import vm from "node:vm";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

// ---- 1. Load the reference script and capture its functions ---------------
const refHtml = readFileSync(
  "C:/Users/Admin/AppData/Local/Temp/uaenat/pkg/bydre-uaenational-package/reference/index.html",
  "utf8"
);
const refSrc = refHtml.match(/<script>([\s\S]*)<\/script>/)[1];

// Stub the DOM bits the reference touches.
const values = {};
const el = (id) => ({
  get value() {
    return values[id] ?? "";
  },
  set value(v) {
    values[id] = v;
  },
  get checked() {
    return checks[id] ?? false;
  },
  style: {},
  addEventListener() {},
  classList: { add() {}, remove() {} },
  textContent: "",
  dir: "",
  innerHTML: "",
  innerText: "",
});
const checks = {};
const elements = new Proxy({}, { get: (t, k) => t[k] ?? (t[k] = el(k)) });

const ctx = {
  document: {
    getElementById: (id) => elements[id],
    querySelectorAll: () => [],
    createRange: () => ({}),
    createElement: () => el("tmp"),
    body: { appendChild() {} },
    execCommand: () => true,
  },
  localStorage: { getItem: () => null, setItem() {} },
  navigator: {},
  window: {},
  getSelection: () => ({ removeAllRanges() {}, addRange() {} }),
  setTimeout,
  clearTimeout,
  encodeURIComponent,
  console,
};
ctx.window = ctx;
vm.createContext(ctx);
// Point the reference at the same absolute asset paths as production.
const refBody = refSrc.replace(
  'const ASSET_BASE = "../assets/";',
  'const ASSET_BASE = "https://bydre.vercel.app/uaenational/";'
);
vm.runInContext(refBody, ctx);

// ---- 2. Load our TS module -------------------------------------------------
const tsSrc = readFileSync(path.join(root, "src/lib/uae-national-email.ts"), "utf8");
const js = ts.transpileModule(tsSrc, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const mod = { exports: {} };
new Function("module", "exports", "require", "process", js)(
  mod,
  mod.exports,
  require,
  { env: {} }
);
const { buildEmail, emailSubject, fullDoc } = mod.exports;

// ---- 3. Compare across scenarios -------------------------------------------
const scenarios = [
  {
    lang: "ar",
    values: {
      clientAr: "أحمد",
      agentAr: "سارة",
      agentEn: "Sara",
      title: "Senior Property Consultant",
      phone: "+971 50 123 4567",
      mail: "sara@drehomes.com",
      noteAr: "سأكون بانتظاركم شخصياً.",
    },
    checks: { sOffers: true, sBring: true, sButtons: true, sImages: true },
  },
  {
    lang: "en",
    values: {
      clientEn: "Ahmed <b>& 'x'",
      agentEn: "Sara",
      title: "Consultant",
      phone: "+971501234567",
      mail: "sara@drehomes.com",
      noteEn: "Line one\nLine two",
    },
    checks: { sOffers: true, sBring: true, sButtons: true, sImages: true },
  },
  {
    lang: "both",
    values: {
      clientAr: "محمد",
      clientEn: "Mohammed",
      agentAr: "خالد",
      agentEn: "Khalid",
      title: "Advisor",
      phone: "+971521112233",
      mail: "k@drehomes.com",
      noteAr: "نراكم قريباً",
      noteEn: "See you soon",
    },
    checks: { sOffers: true, sBring: true, sButtons: true, sImages: true },
  },
  {
    lang: "en",
    values: { agentEn: "NoPhone" },
    checks: { sOffers: false, sBring: false, sButtons: false, sImages: false },
  },
];

let pass = 0,
  fail = 0;
for (const [i, sc] of scenarios.entries()) {
  for (const k of Object.keys(values)) delete values[k];
  Object.assign(values, sc.values);
  for (const k of ["sOffers", "sBring", "sButtons", "sImages"])
    checks[k] = !!sc.checks[k];
  vm.runInContext(`lang = ${JSON.stringify(sc.lang)}`, ctx);
  const refBuild = vm.runInContext("build()", ctx);
  const refSubject = vm.runInContext("subject()", ctx);
  const refDoc = vm.runInContext("fullDoc()", ctx);

  const st = {
    lang: sc.lang,
    clientAr: values.clientAr || "",
    clientEn: values.clientEn || "",
    agentAr: values.agentAr || "",
    agentEn: values.agentEn || "",
    title: values.title || "",
    phone: values.phone || "",
    mail: values.mail || "",
    noteAr: values.noteAr || "",
    noteEn: values.noteEn || "",
    offers: checks.sOffers,
    bring: checks.sBring,
    buttons: checks.sButtons,
    images: checks.sImages,
  };
  const ours = buildEmail(st);
  const ourSubject = emailSubject(st.lang);
  const ourDoc = fullDoc(st);

  const norm = (s) =>
    s.replaceAll(
      "https://bydre.vercel.app/uaenational/banner.jpg",
      "__BANNER__"
    ).replaceAll(
      "https://bydre.vercel.app/uaenational/dre-logo.png",
      "__LOGO__"
    );

  if (norm(refBuild) === norm(ours) && refSubject === ourSubject && norm(refDoc) === norm(ourDoc)) {
    console.log(`PASS scenario ${i + 1} (${sc.lang})`);
    pass++;
  } else {
    fail++;
    console.log(`FAIL scenario ${i + 1} (${sc.lang})`);
    if (refSubject !== ourSubject) console.log("  subject differs", { refSubject, ourSubject });
    if (norm(refBuild) !== norm(ours)) {
      const a = norm(refBuild), b = norm(ours);
      let d = 0;
      while (a[d] === b[d]) d++;
      console.log("  build differs at", d);
      console.log("  ref:", JSON.stringify(a.slice(d - 60, d + 120)));
      console.log("  our:", JSON.stringify(b.slice(d - 60, d + 120)));
    }
  }
}
// absolute URL checks
const sample = buildEmail({
  lang: "en", clientAr: "", clientEn: "", agentAr: "", agentEn: "", title: "",
  phone: "", mail: "", noteAr: "", noteEn: "",
  offers: true, bring: true, buttons: true, images: true,
});
if (
  sample.includes('src="https://bydre.vercel.app/uaenational/banner.jpg"') &&
  sample.includes('src="https://bydre.vercel.app/uaenational/dre-logo.png"') &&
  !sample.includes("../assets/") &&
  !sample.includes("data:")
) {
  console.log("PASS absolute image URLs");
  pass++;
} else {
  console.log("FAIL absolute image URLs");
  fail++;
}
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
