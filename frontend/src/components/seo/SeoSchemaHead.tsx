import React, { useEffect } from "react";

export interface SeoSchemaProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  type?: "website" | "article" | "product";
  schemaType?: "SoftwareApplication" | "Article" | "WebApplication" | "Guide";
  schemaData?: Record<string, any>;
  publishedDate?: string;
  modifiedDate?: string;
}

export const SeoSchemaHead: React.FC<SeoSchemaProps> = ({
  title,
  description,
  canonicalUrl = window.location.href,
  type = "website",
  schemaType = "SoftwareApplication",
  schemaData,
  publishedDate,
  modifiedDate,
}) => {
  useEffect(() => {
    // 1. Update document title
    document.title = `${title} | CiteClash`;

    // 2. Helper to set or create meta tag
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        if (isProperty) {
          meta.setAttribute("property", name);
        } else {
          meta.setAttribute("name", name);
        }
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Helper to set canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    // Meta descriptions and OpenGraph
    setMetaTag("description", description);
    setMetaTag("og:title", title, true);
    setMetaTag("og:description", description, true);
    setMetaTag("og:url", canonicalUrl, true);
    setMetaTag("og:type", type, true);
    setMetaTag("og:site_name", "CiteClash", true);
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", title);
    setMetaTag("twitter:description", description);

    // 3. Generate JSON-LD Schema
    const baseOrganization = {
      "@type": "Organization",
      "name": "CiteClash",
      "url": "https://citeclash.com",
      "logo": "https://citeclash.com/favicon.svg",
      "sameAs": [
        "https://twitter.com/citeclash",
        "https://github.com/citeclash"
      ]
    };

    let schemas: any[] = [];

    if (schemaType === "SoftwareApplication") {
      schemas = [
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "CiteClash",
          "operatingSystem": "All (Cloud/Web)",
          "applicationCategory": "BusinessApplication",
          "description": description,
          "offers": {
            "@type": "Offer",
            "price": "49.00",
            "priceCurrency": "USD"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "128"
          }
        },
        {
          "@context": "https://schema.org",
          ...baseOrganization
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is Generative Engine Optimization (GEO)?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Generative Engine Optimization (GEO) is the discipline of optimizing brand visibility and citations inside AI search models like ChatGPT, Perplexity, Google Gemini, and Groq."
              }
            },
            {
              "@type": "Question",
              "name": "How does CiteClash guarantee zero AI hallucination in scoring?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "CiteClash extracts mentions and ranks using deterministic pure-Python regex and DOM list parsing on the raw model responses, rather than relying on an LLM to evaluate itself."
              }
            }
          ]
        }
      ];
    } else if (schemaType === "Article" || schemaType === "Guide") {
      schemas = [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": title,
          "description": description,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonicalUrl
          },
          "datePublished": publishedDate || new Date().toISOString(),
          "dateModified": modifiedDate || new Date().toISOString(),
          "author": {
            "@type": "Organization",
            "name": "CiteClash Research Team"
          },
          "publisher": baseOrganization,
          ...(schemaData || {})
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://citeclash.com"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Guides",
              "item": "https://citeclash.com/guides"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": title,
              "item": canonicalUrl
            }
          ]
        }
      ];
    } else if (schemaType === "WebApplication") {
      schemas = [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": title,
          "url": canonicalUrl,
          "description": description,
          "applicationCategory": "DeveloperApplication",
          "browserRequirements": "Requires JavaScript",
          "creator": baseOrganization
        }
      ];
    }

    // Insert JSON-LD script
    let scriptTag = document.getElementById("json-ld-schema") as HTMLScriptElement;
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.id = "json-ld-schema";
      scriptTag.type = "application/ld+json";
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify(schemas, null, 2);

    return () => {
      // Cleanup script tag on unmount if needed
    };
  }, [title, description, canonicalUrl, type, schemaType, schemaData, publishedDate, modifiedDate]);

  return null;
};
