// Regression checks for the Outlook-hardened email builder.
// Verifies the generated markup survives Gmail/Outlook paste sanitizers:
// no `background:` shorthand, bgcolor attributes on all colored cells,
// fixed width on the card, absolute image URLs, and escaped user input.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

const tsSrc = readFileSync(
  path.join(root, "src/lib/uae-national-email.ts"),
  "utf8"
);
const js = ts.transpileModule(tsSrc, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const mod = { exports: {} };
new Function("module", "exports", "require", "process", js)(
  mod,
  mod.exports,
  require,
  { env: {} }
);
const { buildEmail, emailSubject, fullDoc } = mod.exports;

const base = {
  clientAr: "أحمد",
  clientEn: "Ahmed",
  agentAr: "سارة",
  agentEn: "Sara",
  title: "Senior Property Consultant",
  phone: "+971 50 123 4567",
  mail: "sara@drehomes.com",
  noteAr: "سأكون بانتظاركم شخصياً.",
  noteEn: "See you there.",
  offers: true,
  bring: true,
  buttons: true,
  images: true,
};

let pass = 0,
  fail = 0;
function check(name, cond) {
  if (cond) {
    console.log("PASS", name);
    pass++;
  } else {
    console.log("FAIL", name);
    fail++;
  }
}

for (const lang of ["ar", "en", "both"]) {
  const html = buildEmail({ ...base, lang });
  check(`${lang}: no background: shorthand`, !/style="[^"]*background:/.test(html));
  check(`${lang}: green button carries bgcolor`, html.includes('bgcolor="#00843D"'));
  check(`${lang}: navy footer carries bgcolor`, html.includes('bgcolor="#152C3A"'));
  check(`${lang}: flag stripe carries bgcolor`, html.includes('bgcolor="#C8102E"'));
  check(`${lang}: card has fixed width`, html.includes('width="600"'));
  check(`${lang}: paragraphs use mso line-height`, html.includes("mso-line-height-rule:exactly"));
  check(`${lang}: absolute image URLs`,
    html.includes('src="https://bydre.vercel.app/uaenational/banner.jpg"') &&
    html.includes('src="https://bydre.vercel.app/uaenational/dre-logo.png"') &&
    !html.includes("../assets/") &&
    !html.includes("data:"));
}

// WhatsApp button appears when a phone is present, hidden when absent.
check(
  "wa button rendered with phone",
  buildEmail({ ...base, lang: "en" }).includes("https://wa.me/971501234567")
);
check(
  "wa button hidden without phone",
  !buildEmail({ ...base, lang: "en", phone: "" }).includes("wa.me/")
);

// Images-off shows the dre wordmark.
check(
  "images off shows wordmark",
  buildEmail({ ...base, lang: "en", images: false }).includes(">dre</span>")
);

// Section toggles remove their blocks.
const stripped = buildEmail({ ...base, lang: "en", offers: false, bring: false, buttons: false });
check(
  "toggles remove blocks",
  !stripped.includes("Waiting for you on the day") &&
    !stripped.includes("Before you come") &&
    !stripped.includes("Add to calendar")
);

// User input is escaped.
const evil = buildEmail({
  ...base,
  lang: "en",
  clientEn: '<img src=x onerror="alert(1)">',
});
check("client name escaped", evil.includes("&lt;img") && !evil.includes('<img src=x'));

// Subjects per language.
check("ar subject", emailSubject("ar").startsWith("تأكيد حضوركم"));
check("en subject", emailSubject("en") === "You're confirmed: DRE Eid Al Etihad Open House, 2 December");
check("both subject", emailSubject("both").includes("You're confirmed"));

// fullDoc wraps the email in a complete document.
const doc = fullDoc({ ...base, lang: "en" });
check("fullDoc", doc.startsWith("<!DOCTYPE html>") && doc.includes('bgcolor="#F4F8FA"'));

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
