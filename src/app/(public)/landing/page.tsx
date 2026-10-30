"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Expand,
  Download,
  FileText,
  MapPin,
  Mail,
  MessageCircle,
  Menu,
  Phone,
  ShieldCheck,
  Trees,
  Waves,
  X,
} from "lucide-react";
import { RegisterSection } from "@/components/landing/RegisterSection";
import styles from "./landing.module.css";

const photos = [
  {
    src: "/images/palm-springs-coastal-view.jpg",
    alt: "Coastal panorama with landscaped villas and the palm-shaped island beyond",
  },
  {
    src: "/images/palm-springs-community.jpg",
    alt: "Palm-lined villa community with landscaped paths and sports courts",
  },
  {
    src: "/images/palm-springs-location.jpg",
    alt: "Aerial location illustration with a highlighted site near the palm-shaped island",
  },
];
const documents = [
  {
    filename: "DRE_La_Tilia_Floor_Plans.pdf",
    title: "La Tilia floor plans",
    category: "Floor plans",
    size: "7.97 MB",
  },
  {
    filename: "DRE_Palm_Springs_vs_JVA_and_Al_Furjan.pdf",
    title: "Palm Springs vs JVA & Al Furjan",
    category: "Comparison",
    size: "347 KB",
  },
  {
    filename: "DRE_Palm_Springs_vs_JVA_and_Murooj_Al_Furjan.pdf",
    title: "Palm Springs vs JVA & Murooj Al Furjan",
    category: "Comparison",
    size: "356 KB",
  },
];
const units = [
  ["3-bedroom townhouse", "Mid unit", "2,300", "3.80M"],
  ["4-bedroom townhouse", "G+1", "2,800", "4.62M"],
  ["4-bedroom townhouse", "Corner · G+2", "3,300", "5.45M"],
  ["4-bedroom villa", "Standalone", "4,400", "7.20M"],
  ["5-bedroom villa", "Standalone", "5,400", "9.00M"],
];
const sections = [
  ["overview", "Overview"],
  ["documents", "Documents"],
  ["residences", "Residences"],
  ["payment-plan", "Payment plan"],
  ["location", "Location"],
  ["developer", "Developer"],
];

function NakheelLogo() {
  return (
    <span className={styles.nakheelLogo}>
      <Image
        src="/images/nakheel-logo.png"
        alt="Nakheel"
        width={338}
        height={265}
      />
    </span>
  );
}

function ContactButtons() {
  return (
    <div className={styles.contactButtons}>
      <a
        href="https://wa.me/971585837346"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.whatsappButton}
      >
        <MessageCircle size={18} /> WhatsApp us <ArrowUpRight size={16} />
      </a>
      <a href="tel:+971527543243">
        <Phone size={16} />
        <span>
          Hotline<strong>+971 52 754 3243</strong>
        </span>
      </a>
      <a href="mailto:sales@drehomes.com">
        <Mail size={16} />
        <span>
          Mail<strong>sales@drehomes.com</strong>
        </span>
      </a>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [gallery, setGallery] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [mapType, setMapType] = useState<"m" | "k">("m");
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setShareError(false);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setShareError(true);
    }
  };

  return (
    <div className={styles.page}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <header className={styles.header}>
        <Link href="/landing" aria-label="DRE home" className={styles.logo}>
          <Image
            src="/dre-logo.png"
            alt="DRE"
            width={112}
            height={58}
            priority
          />
          <span>REAL ESTATE, REIMAGINED.</span>
        </Link>
        <nav
          className={`${styles.headerNav} ${menuOpen ? styles.open : ""}`}
          aria-label="Main navigation"
        >
          <a href="#overview" onClick={() => setMenuOpen(false)}>
            The project
          </a>
          <a href="#residences" onClick={() => setMenuOpen(false)}>
            Residences
          </a>
          <a href="#location" onClick={() => setMenuOpen(false)}>
            The neighbourhood
          </a>
          <Link href="/login">
            Client portal <ArrowUpRight size={13} />
          </Link>
        </nav>
        <a href="#register" className={styles.headerCta}>
          Let’s talk <ArrowUpRight size={16} />
        </a>
        <button
          className={styles.menu}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <main id="main" className={styles.main}>
        <div className={styles.breadcrumb}>
          <a href="#overview">
            <ArrowLeft size={14} /> Discover with DRE
          </a>
          <span>
            Dubai <span>/</span> Jebel Ali <span>/</span> Palm Springs
          </span>
          <button onClick={share}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Link copied" : "Share project"}
          </button>
        </div>
        {shareError && (
          <p role="status">
            Please copy the page address from your browser to share this
            project.
          </p>
        )}
        <div className={styles.titleRow}>
          <div>
            <p className={styles.eyebrow}>
              <span /> A NEW CHAPTER BY <NakheelLogo />
            </p>
            <h1>
              Palm Springs<span>.</span>
            </h1>
            <p className={styles.address}>
              <MapPin size={16} /> Jebel Ali, Dubai{" "}
              <span className={styles.addressDivider}>|</span> A little closer
              to extraordinary.
            </p>
          </div>
          <div className={styles.launch}>
            <span className={styles.launchDot} /> Upcoming launch
            <span>Expected November 2026</span>
          </div>
        </div>

        <div className={styles.gallery}>
          {photos.map((photo, index) => (
            <button
              key={photo.src}
              onClick={() => setGallery(index)}
              className={index === 0 ? styles.mainPhoto : styles.smallPhoto}
              aria-label={`Open gallery: ${photo.alt}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                unoptimized
                priority={index === 0}
                sizes={index === 0 ? "(max-width: 760px) 100vw, 65vw" : "35vw"}
              />
              <span className={styles.photoShade} />
              {index === 0 && (
                <span className={styles.galleryTag}>
                  SPACE TO LIVE. ROOM TO GROW.
                </span>
              )}
              {index === 2 && (
                <span className={styles.viewPhotos}>
                  <Expand size={15} /> View all photos
                </span>
              )}
            </button>
          ))}
          <span className={styles.imageNote}>
            Project gallery · imagery and location indicative
          </span>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.details}>
            <nav className={styles.tabs} aria-label="Project sections">
              {sections.map(([id, label]) => (
                <a key={id} href={`#${id}`}>
                  {label}
                </a>
              ))}
            </nav>
            <div className={styles.quickFacts}>
              {[
                ["PROPERTY TYPE", "Townhouses & villas"],
                ["BEDROOMS", "3, 4 & 5 bedrooms"],
                ["HANDOVER", "Q1 2031"],
                ["PAYMENT PLAN", "60 / 40"],
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <section id="overview" className={styles.section}>
              <p className={styles.eyebrow}>THE ART OF LIVING WELL</p>
              <h2>
                Not just a new home.
                <br />A whole new way of life.
              </h2>
              <p>
                Morning light. Open spaces. A place where the everyday feels a
                little more exceptional. Welcome to Palm Springs, an upcoming
                collection of townhouses and standalone villas in Jebel Ali by
                <NakheelLogo />, part of Dubai Holding.
              </p>
              <p>
                Designed around the possibilities of family life, this planned
                community brings generous homes and a connected Dubai address
                together. Discover your next chapter, with DRE by your side.
              </p>
              <div className={styles.lifestyle}>
                {[
                  [Trees, "Room to breathe", "A community-led setting"],
                  [Waves, "Your own sanctuary", "Space for a slower pace"],
                  [MapPin, "Connected living", "A Jebel Ali address"],
                ].map(([Icon, title, detail]) => {
                  const FeatureIcon = Icon as typeof Trees;
                  return (
                    <div key={String(title)}>
                      <FeatureIcon size={24} strokeWidth={1.3} />
                      <strong>{String(title)}</strong>
                      <span>{String(detail)}</span>
                    </div>
                  );
                })}
              </div>
              <div className={styles.note}>
                <ShieldCheck size={20} />
                <p>
                  A considered start. Launch pricing, specifications and dates
                  are preliminary and subject to confirmation by the developer.
                  Our advisors can help you understand the latest availability.
                </p>
              </div>
            </section>
            <section id="documents" className={styles.section}>
              <p className={styles.eyebrow}>THE DETAILS, AT YOUR FINGERTIPS</p>
              <h2>Take a closer look.</h2>
              <p>
                Download floor plans and community comparisons to explore at
                your own pace.
              </p>
              <div className={styles.documents}>
                {documents.map((document) => (
                  <a
                    key={document.filename}
                    href={`/landing/documents/${document.filename}`}
                    download={document.filename}
                    className={styles.documentCard}
                  >
                    <span className={styles.pdfIcon}>
                      <FileText size={22} />
                      <span>PDF</span>
                    </span>
                    <span className={styles.documentInfo}>
                      <span>{document.category}</span>
                      <strong>{document.title}</strong>
                      <small>PDF · {document.size}</small>
                    </span>
                    <Download size={18} aria-hidden="true" />
                    <span className="sr-only">Download PDF</span>
                  </a>
                ))}
              </div>
              <p className={styles.caption}>
                La Tilia floor plans are provided as a separate reference
                document, not confirmed Palm Springs layouts. Final project
                details remain subject to developer confirmation.
              </p>
            </section>
            <section id="residences" className={styles.section}>
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.eyebrow}>FIND YOUR PERFECT FIT</p>
                  <h2>Space for every chapter.</h2>
                </div>
                <span>05 residence types</span>
              </div>
              <p>
                From a first family home to a little more room for everyone.
                Explore the anticipated collection.
              </p>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Residence</th>
                      <th>Size from</th>
                      <th>Expected from</th>
                      <th>
                        <span className="sr-only">Enquire</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map(([title, type, size, price]) => (
                      <tr key={type}>
                        <td>
                          <strong>{title}</strong>
                          <span>{type}</span>
                        </td>
                        <td>
                          {size} <small>sq ft</small>
                        </td>
                        <td>AED {price}</td>
                        <td>
                          <a
                            href="#register"
                            aria-label={`Enquire about ${title}, ${type}`}
                          >
                            <ArrowUpRight size={18} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={styles.caption}>
                Indicative pre-launch figures. Final sizes, prices and inventory
                will be confirmed at launch.
              </p>
            </section>
            <section id="payment-plan" className={styles.section}>
              <p className={styles.eyebrow}>A PLAN FOR YOUR FUTURE</p>
              <h2>Your next move, made simpler.</h2>
              <p>A proposed 60/40 payment plan, with time to plan ahead.</p>
              <div className={styles.payment}>
                {[
                  ["20", "On booking", "Down payment"],
                  ["40", "During construction", "As your home takes shape"],
                  ["40", "On handover", "Expected Q1 2031"],
                ].map(([percent, title, sub], index) => (
                  <div key={title}>
                    <span className={styles.step}>0{index + 1}</span>
                    <strong>
                      {percent}
                      <span>%</span>
                    </strong>
                    <h3>{title}</h3>
                    <p>{sub}</p>
                  </div>
                ))}
              </div>
            </section>
            <section id="location" className={styles.section}>
              <p className={styles.eyebrow}>THE NEIGHBOURHOOD</p>
              <h2>A new perspective on Dubai.</h2>
              <p>
                Jebel Ali puts you in Dubai’s south-west corridor, with access
                to Sheikh Zayed Road, the Red Line Metro and one of the region’s
                most established business and logistics districts.
              </p>
              <div className={styles.locationCard}>
                <div className={styles.mapToolbar}>
                  <strong>
                    <MapPin size={16} /> Jebel Ali, Dubai
                  </strong>
                  <div role="group" aria-label="Map view">
                    <button
                      type="button"
                      aria-pressed={mapType === "m"}
                      onClick={() => setMapType("m")}
                    >
                      Map
                    </button>
                    <button
                      type="button"
                      aria-pressed={mapType === "k"}
                      onClick={() => setMapType("k")}
                    >
                      Satellite
                    </button>
                  </div>
                </div>
                <iframe
                  title={`Jebel Ali interactive Google ${mapType === "k" ? "satellite" : "street"} map`}
                  src={`https://maps.google.com/maps?q=24.9510,55.0388&z=13&t=${mapType}&output=embed`}
                  className={styles.mapFrame}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p className={styles.caption}>
                Area location only. Exact project location to be confirmed by
                the developer.
              </p>
            </section>
            <section
              id="developer"
              className={`${styles.section} ${styles.developer}`}
            >
              <div>
                <p className={styles.eyebrow}>A VISION, BUILT ON EXPERIENCE</p>
                <h2>
                  By <NakheelLogo />.
                  <br />
                  For what comes next.
                </h2>
                <p>
                  Part of Dubai Holding, <NakheelLogo /> is the master developer
                  behind Palm Jumeirah, The World and Jumeirah Islands. Palm
                  Springs brings that vision to a new chapter in Jebel Ali.
                </p>
              </div>
              <div className={styles.developerMark}>
                <NakheelLogo />
                <span>PART OF DUBAI HOLDING</span>
              </div>
            </section>
          </div>
          <aside className={styles.sidebar}>
            <div className={styles.enquiryCard}>
              <p className={styles.eyebrow}>YOUR NEXT CHAPTER STARTS HERE</p>
              <span className={styles.priceLabel}>Expected starting price</span>
              <div className={styles.price}>
                <small>AED</small> 3,800,000
              </div>
              <p className={styles.priceFoot}>
                20% down payment <span>·</span> 60/40 payment plan
              </p>
              <a href="#register" className={styles.primaryButton}>
                Register your interest <ArrowUpRight size={17} />
              </a>
              <a href="#residences" className={styles.secondaryButton}>
                Explore the residences <ArrowDown size={16} />
              </a>
              <ContactButtons />
              <a href="#documents" className={styles.secondaryButton}>
                Project documents <Download size={16} />
              </a>
              <div className={styles.advisor}>
                <Image src="/dre-logo.png" width={70} height={37} alt="DRE" />
                <div>
                  <strong>A personal approach. Always.</strong>
                  <span>Your DRE property advisor</span>
                </div>
              </div>
              <p className={styles.advisorText}>
                Get the latest launch updates, explore your options and find a
                home that feels like you.
              </p>
              <div className={styles.cardFooter}>
                <ShieldCheck size={15} /> No obligation. Just expert guidance.
              </div>
            </div>
            <p className={styles.sidebarNote}>
              An exceptional address.
              <br />A trusted partner.
              <br />
              <span>That’s the DRE difference.</span>
            </p>
          </aside>
        </div>
        <div className={styles.contactSection}>
          <div className={styles.contactIntro}>
            <p className={styles.eyebrow}>LET’S MAKE IT YOURS</p>
            <h2>
              Great places.
              <br />
              Even better possibilities.
            </h2>
            <p>
              Tell us a little about yourself. Our team will help you explore
              Palm Springs, from the first question to your next move.
            </p>
            <span>
              <ShieldCheck size={18} /> Personal guidance, every step of the
              way.
            </span>
            <ContactButtons />
          </div>
          <RegisterSection />
        </div>
      </main>
      <footer className={styles.footer}>
        <div>
          <Image src="/dre-logo.png" alt="DRE" width={100} height={52} />
          <p>
            Real estate is personal.
            <br />
            We keep it that way.
          </p>
        </div>
        <div>
          <a href="#overview">The project</a>
          <a href="#residences">Residences</a>
          <a href="#register">Get in touch</a>
          <Link href="/login">
            Client portal <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} DRE. All rights reserved.</span>
          <span>
            Prices and availability are subject to change. Purchase fees are
            additional.
          </span>
        </div>
      </footer>
      <div className={styles.mobileBar}>
        <div>
          <span>Expected from</span>
          <strong>AED 3.80M</strong>
        </div>
        <a href="#register">
          Register interest <ArrowUpRight size={16} />
        </a>
      </div>
      <Dialog.Root
        open={gallery !== null}
        onOpenChange={(open) => {
          if (!open) setGallery(null);
        }}
      >
        <Dialog.Portal>
          {gallery !== null && (
            <Dialog.Content
              aria-describedby={undefined}
              className={styles.lightbox}
              onKeyDown={(event) => {
                if (event.key === "Escape") setGallery(null);
                if (event.key === "ArrowRight")
                  setGallery((gallery + 1) % photos.length);
                if (event.key === "ArrowLeft")
                  setGallery((gallery + photos.length - 1) % photos.length);
              }}
            >
              <Dialog.Title className="sr-only">
                Project image gallery
              </Dialog.Title>
              <button
                className={styles.closeGallery}
                onClick={() => setGallery(null)}
                aria-label="Close gallery"
              >
                <X />
              </button>
              <button
                onClick={() =>
                  setGallery((gallery + photos.length - 1) % photos.length)
                }
                aria-label="Previous photo"
              >
                <ChevronLeft />
              </button>
              <div className={styles.lightboxImage}>
                <Image
                  src={photos[gallery].src}
                  alt={photos[gallery].alt}
                  fill
                  unoptimized
                  sizes="85vw"
                />
                <p>
                  {gallery + 1} / {photos.length} · Imagery and location
                  indicative
                </p>
              </div>
              <button
                onClick={() => setGallery((gallery + 1) % photos.length)}
                aria-label="Next photo"
              >
                <ChevronRight />
              </button>
            </Dialog.Content>
          )}
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
