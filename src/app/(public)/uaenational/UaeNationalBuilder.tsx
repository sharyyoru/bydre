"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildEmail,
  emailSubject,
  fullDoc,
  type UaeNationalLang,
  type UaeNationalState,
} from "@/lib/uae-national-email";
import styles from "./uaenational.module.css";

const STORAGE_KEY = "dre-oh-agent";
const KEEP = ["agentAr", "agentEn", "title", "phone", "mail"] as const;

const INITIAL: UaeNationalState = {
  lang: "ar",
  clientAr: "",
  clientEn: "",
  agentAr: "",
  agentEn: "",
  title: "",
  phone: "",
  mail: "",
  noteAr: "",
  noteEn: "",
  offers: true,
  bring: true,
  buttons: true,
  images: true,
};

export default function UaeNationalBuilder() {
  const [state, setState] = useState<UaeNationalState>(INITIAL);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const emailRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore remembered agent details on first load.
  useEffect(() => {
    try {
      const o = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      setState((s) => {
        const next = { ...s };
        KEEP.forEach((k) => {
          if (o[k]) next[k] = o[k];
        });
        if (o.lang) next.lang = o.lang;
        return next;
      });
    } catch {}
  }, []);

  // Persist agent details (never client names or personal messages).
  useEffect(() => {
    try {
      const o: Record<string, string> = { lang: state.lang };
      KEEP.forEach((k) => {
        o[k] = state[k];
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
    } catch {}
  }, [state]);

  const html = useMemo(() => buildEmail(state), [state]);
  const subject = emailSubject(state.lang);

  function set<K extends keyof UaeNationalState>(k: K, v: UaeNationalState[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }

  function toast(msg: string) {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600);
  }

  async function copyRich() {
    const text = emailRef.current?.innerText || "";
    try {
      if (
        window.ClipboardItem &&
        navigator.clipboard &&
        navigator.clipboard.write
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
        return toast("Email copied. Paste it into a new email.");
      }
    } catch {}
    try {
      // fallback: select the rendered preview
      const r = document.createRange();
      if (emailRef.current) r.selectNodeContents(emailRef.current);
      const sel = getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(r);
      }
      const ok = document.execCommand("copy");
      sel?.removeAllRanges();
      toast(
        ok
          ? "Email copied. Paste it into a new email."
          : "Couldn't copy automatically. Select the preview and press Ctrl/⌘ + C."
      );
    } catch {
      toast(
        "Couldn't copy automatically. Select the preview and press Ctrl/⌘ + C."
      );
    }
  }

  async function copyText(s: string, msg: string) {
    try {
      await navigator.clipboard.writeText(s);
      toast(msg);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = s;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast(msg);
      } catch {
        toast("Couldn't copy automatically.");
      }
      ta.remove();
    }
  }

  const lang = state.lang;
  const showAr = () => lang !== "en";
  const showEn = (k: "client" | "agent" | "note") =>
    !(lang === "ar" && k !== "agent");

  return (
    <div className={styles.page}>
      <div className={styles.flag}></div>
      <header className={styles.top}>
        <div>
          <h1>Open House RSVP Email Builder</h1>
          <p>
            DRE Eid Al Etihad Open House · Wed 2 Dec · For clients who have
            confirmed
          </p>
        </div>
      </header>

      <div className={styles.wrap}>
        <aside className={styles.panel} aria-label="Email settings">
          <div className={styles.step}>1 · Language</div>
          <div className={styles.seg} role="group" aria-label="Language">
            <button
              type="button"
              aria-pressed={lang === "ar"}
              onClick={() => set("lang", "ar" as UaeNationalLang)}
            >
              العربية
            </button>
            <button
              type="button"
              aria-pressed={lang === "en"}
              onClick={() => set("lang", "en")}
            >
              English
            </button>
            <button
              type="button"
              aria-pressed={lang === "both"}
              onClick={() => set("lang", "both")}
            >
              Both
            </button>
          </div>

          <div className={styles.step}>2 · Your client</div>
          {showAr() && (
            <div>
              <label htmlFor="clientAr">
                Client name in Arabic <small>(optional)</small>
              </label>
              <input
                type="text"
                id="clientAr"
                dir="rtl"
                placeholder="مثال: أحمد"
                value={state.clientAr}
                onChange={(e) => set("clientAr", e.target.value)}
              />
            </div>
          )}
          {showEn("client") && (
            <div>
              <label htmlFor="clientEn">
                Client name in English <small>(optional)</small>
              </label>
              <input
                type="text"
                id="clientEn"
                placeholder="e.g. Ahmed"
                value={state.clientEn}
                onChange={(e) => set("clientEn", e.target.value)}
              />
            </div>
          )}

          <div className={styles.step}>3 · Your details</div>
          {showAr() && (
            <div>
              <label htmlFor="agentAr">Your name in Arabic</label>
              <input
                type="text"
                id="agentAr"
                dir="rtl"
                placeholder="الاسم"
                value={state.agentAr}
                onChange={(e) => set("agentAr", e.target.value)}
              />
            </div>
          )}
          {showEn("agent") && (
            <div>
              <label htmlFor="agentEn">Your name in English</label>
              <input
                type="text"
                id="agentEn"
                placeholder="Your name"
                value={state.agentEn}
                onChange={(e) => set("agentEn", e.target.value)}
              />
            </div>
          )}
          <label htmlFor="title">Job title</label>
          <input
            type="text"
            id="title"
            placeholder="e.g. Senior Property Consultant"
            value={state.title}
            onChange={(e) => set("title", e.target.value)}
          />
          <div className={styles.row2}>
            <div>
              <label htmlFor="phone">Mobile / WhatsApp</label>
              <input
                type="tel"
                id="phone"
                placeholder="+971 5X XXX XXXX"
                value={state.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="mail">Email</label>
              <input
                type="email"
                id="mail"
                placeholder="name@drehomes.com"
                value={state.mail}
                onChange={(e) => set("mail", e.target.value)}
              />
            </div>
          </div>
          <p className={styles.hint}>
            Your details are remembered on this device for next time.
          </p>

          <div className={styles.step}>
            4 · Personal message{" "}
            <span className={styles.opt}>(optional)</span>
          </div>
          {showAr() && (
            <div>
              <label htmlFor="noteAr">In Arabic</label>
              <textarea
                id="noteAr"
                dir="rtl"
                placeholder="مثال: سأكون بانتظاركم شخصياً، وقد جهّزت لكم مجموعة من الخيارات التي تناسب ما تحدثنا عنه."
                value={state.noteAr}
                onChange={(e) => set("noteAr", e.target.value)}
              ></textarea>
            </div>
          )}
          {showEn("note") && (
            <div>
              <label htmlFor="noteEn">In English</label>
              <textarea
                id="noteEn"
                placeholder="e.g. I've put together a few options that match what we discussed. I'll have them ready for you."
                value={state.noteEn}
                onChange={(e) => set("noteEn", e.target.value)}
              ></textarea>
            </div>
          )}

          <div className={styles.step}>5 · Sections</div>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={state.offers}
              onChange={(e) => set("offers", e.target.checked)}
            />
            <span>
              Offers on the day
              <small>From AED 550K, exclusive offers for UAE Nationals</small>
            </span>
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={state.bring}
              onChange={(e) => set("bring", e.target.checked)}
            />
            <span>
              &quot;Before you come&quot;
              <small>Emirates ID and family welcome</small>
            </span>
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={state.buttons}
              onChange={(e) => set("buttons", e.target.checked)}
            />
            <span>Directions, calendar &amp; WhatsApp buttons</span>
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={state.images}
              onChange={(e) => set("images", e.target.checked)}
            />
            <span>
              Logo &amp; banner image
              <small>Untick if images don&apos;t show after pasting</small>
            </span>
          </label>
        </aside>

        <main className={styles.main}>
          <div className={styles.bar}>
            <div className={styles.subject}>
              <div className={styles.lbl}>Subject line</div>
              <div
                className={styles.val}
                dir={lang === "ar" ? "rtl" : "auto"}
              >
                {subject}
              </div>
            </div>
            <button
              className={`${styles.btn} ${styles.ghost}`}
              type="button"
              onClick={() => copyText(subject, "Subject copied.")}
            >
              Copy subject
            </button>
            <button
              className={`${styles.btn} ${styles.primary}`}
              type="button"
              onClick={copyRich}
            >
              Copy email
            </button>
            <button
              className={`${styles.btn} ${styles.ghost}`}
              type="button"
              onClick={() => copyText(fullDoc(state), "HTML code copied.")}
            >
              Copy HTML code
            </button>
          </div>
          <div className={styles.stage}>
            <div
              ref={emailRef}
              className={styles.email}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
          <div className={styles.how}>
            <b>How to send</b>
            <ol>
              <li>
                Fill in your client&apos;s name and your details on the left.
                The preview updates as you type.
              </li>
              <li>
                Click <b>Copy email</b>, open a new email in Outlook, Gmail or
                Zoho Mail and paste (Ctrl/⌘ + V).
              </li>
              <li>
                Click <b>Copy subject</b> and paste it into the subject line,
                add your client&apos;s address and send.
              </li>
            </ol>
            <p>
              Using Zoho Campaigns or another email tool? Use{" "}
              <b>Copy HTML code</b> and paste it into its HTML editor.
            </p>
          </div>
        </main>
      </div>
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
