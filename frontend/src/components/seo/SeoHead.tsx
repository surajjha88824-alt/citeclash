import React, { useEffect } from "react";
import type { FAQItem } from "../../data/seoRegistry";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath: string;
  pageType: "compare" | "alternatives" | "tracker" | "tool" | "hub";
  breadcrumbs: BreadcrumbItem[];
  faqs?: FAQItem[];
  itemListNames?: string[];
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  title,
  description,
  canonicalPath,
  pageType,
  breadcrumbs,
  faqs = [],
  itemListNames = [],
}) => {
  useEffect(() => {
    const canonicalUrl = `https://citeclash.com${canonicalPath}`;
    document.title = `${title} | CiteClash`;

    const setMeta = (key: string, val: string, isProp = false) => {
      const sel = isProp ? `meta[property="${key}"]` : `meta[name="${key}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        if (isProp) el.setAttribute("property", key);
        else el.setAttribute("name", key);
        document.head.appendChild(el);
      }
      el.content = val;
    };

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonicalUrl;

    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:url", canonicalUrl, true);
    setMeta("og:type", pageType === "alternatives" ? "article" : "website", true);
    setMeta("og:site_name", "CiteClash", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);

    const schemas: Record<string, any>[] = [];

    // 1. Primary Page Schema
    if (pageType === "compare") {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "CiteClash",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description,
        url: canonicalUrl,
        offers: {
          "@type": "Offer",
          price: "49.00",
          priceCurrency: "USD",
        },
      });
    } else if (pageType === "alternatives") {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        url: canonicalUrl,
        datePublished: "2026-11-01",
        dateModified: "2026-11-25",
        author: { "@type": "Organization", name: "CiteClash Editorial" },
        publisher: { "@type": "Organization", name: "CiteClash", url: "https://citeclash.com" },
      });
      if (itemListNames.length > 0) {
        schemas.push({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: title,
          itemListElement: itemListNames.map((name, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            name,
          })),
        });
      }
    } else {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: title,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description,
        url: canonicalUrl,
      });
    }

    // 2. BreadcrumbList
    if (breadcrumbs.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: b.name,
          item: b.url.startsWith("http") ? b.url : `https://citeclash.com${b.url}`,
        })),
      });
    }

    // 3. FAQPage
    if (faqs.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a,
          },
        })),
      });
    }

    const oldScripts = document.querySelectorAll('script[data-citeclash-seo="true"]');
    oldScripts.forEach((s) => s.remove());

    schemas.forEach((schemaObj) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-citeclash-seo", "true");
      script.text = JSON.stringify(schemaObj);
      document.head.appendChild(script);
    });
  }, [title, description, canonicalPath, pageType, breadcrumbs, faqs, itemListNames]);

  return null;
};
