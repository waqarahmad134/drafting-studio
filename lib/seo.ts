/**
 * Shared SEO / AEO / GEO helpers (Nov 2026).
 *
 * One place for the structured-data entities every page reuses, so the
 * Organization is defined once and referenced everywhere else by @id.
 * Only mark up content that is visible on the page.
 */
import { absoluteUrl } from "@/lib/utils";
import { brand } from "@/lib/theme";

/** Stable @id for the Organization entity; other schema references it. */
export const ORG_ID = absoluteUrl("/#organization");
export const WEBSITE_ID = absoluteUrl("/#website");

/**
 * Organization entity (ProfessionalService is the closest schema.org fit;
 * there is no drafting-specific subtype). Address added 21 Nov 2026 from the
 * user-provided office address (P108 Future Tower, Jubilee Town, Lahore);
 * postalCode 53720 researched the same day: Jubilee Town has no delivery
 * post office of its own in the Pakistan Post directory, and 53720 (Bahria
 * Town delivery office, the neighbouring Canal Road society) is the code
 * used by businesses in Future Tower itself and in Block C Commercial Area.
 * Telephone is the business WhatsApp number already published on the site.
 * No foundingDate: not a verified fact, so it stays out rather than invented. sameAs lists
 * only the social profiles we own and have verified (LinkedIn + Facebook);
 * the YouTube handle is unconfirmed.
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": ORG_ID,
    name: brand.name,
    slogan: brand.tagline,
    description: brand.descriptor,
    url: absoluteUrl(),
    logo: absoluteUrl("/logo.png"),
    email: brand.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: brand.contact.addressLine1,
      addressLocality: brand.contact.city,
      addressRegion: brand.contact.state,
      postalCode: brand.contact.zip,
      addressCountry: "PK",
    },
    telephone: "+92 303 0143281",
    areaServed: "US",
    knowsAbout: [
      "2D AutoCAD drafting",
      "MEP drafting",
      "HVAC drafting",
      "electrical drafting",
      "plumbing drafting",
      "fire protection drafting",
      "permit-ready drawings",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: brand.contact.email,
      areaServed: "US",
      availableLanguage: "en",
    },
    sameAs: [brand.socials.linkedin, brand.socials.facebook],
  };
}

/** WebSite entity, emitted on the homepage only. No SearchAction: the site
 * has no site-wide internal search (the blog has its own scoped search). */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: brand.name,
    url: absoluteUrl(),
    publisher: { "@id": ORG_ID },
  };
}

export type Crumb = { label: string; href?: string };

/** BreadcrumbList mirroring the visible breadcrumb nav. The last crumb has
 * no href (it is the current page); schema.org allows a name-only ListItem. */
export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: absoluteUrl(c.href) } : {}),
    })),
  };
}

/** ItemList for CollectionPage `hasPart` (category / index pages). */
export function itemListJsonLd(items: { name: string; url: string }[]) {
  return {
    "@type": "ItemList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/**
 * Trim a meta description to `max` chars (default 155) at a sentence end
 * where possible, else at the last word boundary. Returns the input
 * unchanged when it already fits. Used for DB-driven descriptions whose
 * source text lives in prisma/content and would otherwise need a live DB
 * sync to change.
 */
export function trimDescription(desc: string | null | undefined, max = 155): string | undefined {
  if (!desc) return undefined;
  if (desc.length <= max) return desc;
  const head = desc.slice(0, max);
  // Prefer a full sentence: last ". " / "? " / "! " inside the limit.
  const sentenceEnd = Math.max(head.lastIndexOf(". "), head.lastIndexOf("? "), head.lastIndexOf("! "));
  if (sentenceEnd > 60) return head.slice(0, sentenceEnd + 1);
  const lastSpace = head.lastIndexOf(" ");
  return lastSpace > 60 ? head.slice(0, lastSpace) : head;
}

export type Faq = { q: string; a: string };

/** FAQPage JSON-LD for a visible Q&A list. Only call with Q&As that are
 * rendered on the page (an empty mainEntity is invalid markup). */
export function faqPageJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Strip inline Markdown (links, bold, code) down to plain text for schema
 * values. Also swaps em-dashes for commas (house rule: no em-dash). */
function stripMdxInline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/ — /g, ", ")
    .replace(/—/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract the visible `## FAQ` section from a post's MDX body as Q&A pairs.
 * FAQ sections are written as `**Question?**` on its own line followed by
 * the answer paragraph(s), ending at the next `## ` heading. Returns [] when
 * the post has no FAQ section, so callers only emit FAQPage schema where the
 * Q&A is actually on the page. No questions are rewritten or invented.
 */
export function extractFaqFromMdx(bodyMdx: string): Faq[] {
  const lines = bodyMdx.split("\n");
  const start = lines.findIndex((l) => /^##\s+FAQ\s*$/.test(l.trim()));
  if (start === -1) return [];
  const faqs: Faq[] = [];
  let current: Faq | null = null;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^##\s/.test(line)) break;
    const q = line.match(/^\*\*(.+?)\*\*$/);
    if (q) {
      if (current) faqs.push(current);
      current = { q: q[1].trim(), a: "" };
      continue;
    }
    if (current && line) current.a = current.a ? `${current.a} ${line}` : line;
  }
  if (current) faqs.push(current);
  return faqs
    .map((f) => ({ q: stripMdxInline(f.q), a: stripMdxInline(f.a) }))
    .filter((f) => f.q.length > 0 && f.a.length > 0);
}
