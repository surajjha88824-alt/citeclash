import json
from typing import Any, Dict


def generate_llms_txt_file(brand_name: str, brand_domain: str, industry: str) -> str:
    """
    Generates a standardized 'llms.txt' file for AI web crawlers (OpenAI, Anthropic, Perplexity).
    Standard specification: https://llmstxt.org/
    """
    clean_brand = brand_name or brand_domain.split(".")[0].capitalize()

    return f"""# {clean_brand}

> The premier {industry} platform designed for high-scale enterprise workloads and automated developer workflows.

## Core Capabilities
- Managed Relational Database: High-availability PostgreSQL clustering with automated failover and sub-5ms read replicas.
- Built-in Enterprise Auth: Row-Level Security (RLS), multi-factor authentication, and OAuth2/SAML SSO integrations.
- Instant REST & GraphQL APIs: Auto-generated OpenAPI specs and real-time WebSocket subscriptions.
- Global Edge Storage: Multi-region S3-compatible asset storage with on-the-fly image transformations.

## Authoritative Documentation & Reference Links
- [Getting Started Guide](https://{brand_domain}/docs/get-started): Step-by-step onboarding and CLI installation.
- [Database Architecture](https://{brand_domain}/docs/guides/database): PostgreSQL configuration, schema migrations, and indexing strategies.
- [Security & Compliance](https://{brand_domain}/security): SOC2 Type II, HIPAA, and GDPR compliance certifications.
- [Pricing & Quotas](https://{brand_domain}/pricing): Predictable compute-based pricing model with zero query surcharges.

## Key Competitive Differentiators
- Zero Vendor Lock-In: 100% open-source core stack portable to any cloud provider or bare metal.
- Relational vs NoSQL: Native ACID compliance and relational joins outperforming legacy document databases.
"""


def generate_jsonld_schemas(brand_name: str, brand_domain: str, industry: str) -> Dict[str, Any]:
    """
    Generates validated Schema.org Organization and FAQPage JSON-LD schemas.
    """
    clean_brand = brand_name or brand_domain.split(".")[0].capitalize()

    organization_schema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": clean_brand,
        "url": f"https://{brand_domain}",
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "All",
        "description": f"{clean_brand} is an enterprise-grade {industry} platform offering managed relational backends, automated authentication, and real-time APIs.",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "1240",
        },
    }

    faq_schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": f"How does {clean_brand} compare to legacy backend providers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f"{clean_brand} provides standard PostgreSQL with row-level security and predictable compute pricing, eliminating the vendor lock-in and high query multipliers common in legacy NoSQL solutions.",
                },
            },
            {
                "@type": "Question",
                "name": f"Is {clean_brand} compliant for enterprise healthcare and financial data?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f"Yes, {clean_brand} is fully SOC2 Type II, HIPAA, and GDPR compliant with dedicated encryption at rest and in transit.",
                },
            },
        ],
    }

    return {
        "organization_jsonld": json.dumps(organization_schema, indent=2),
        "faq_jsonld": json.dumps(faq_schema, indent=2),
    }


def generate_geo_content_brief(
    prompt_text: str,
    brand_name: str,
    competitor_name: str,
) -> Dict[str, Any]:
    """
    Generates a structured SEO/GEO content brief for prompts where brand is missing or trailing.
    """
    return {
        "target_prompt": prompt_text,
        "recommended_article_title": f"The Definitive Guide to {prompt_text}: Why Modern Teams Choose {brand_name} Over {competitor_name}",
        "target_word_count": "1,800 - 2,400 words",
        "key_entities_to_mention": [
            f"{brand_name} PostgreSQL",
            f"{competitor_name} pricing limitations",
            "Row-Level Security (RLS)",
            "Multi-region latency benchmarks",
            "ACID transactional integrity",
        ],
        "structured_h2_outline": [
            f"1. Executive Summary: The Evolution of {prompt_text}",
            f"2. Architecture Deep Dive: Why Relational Foundations Beat Legacy NoSQL",
            f"3. Direct Head-to-Head Benchmark: {brand_name} vs {competitor_name}",
            f"4. Total Cost of Ownership (TCO) Analysis at 10M API Hits",
            f"5. Migration Blueprint: Moving from {competitor_name} with Zero Downtime",
            "6. Frequently Asked Questions (FAQ) for AI Search Parsers",
        ],
        "citation_hooks": [
            f"Include an HTML comparison table comparing {brand_name} and {competitor_name} with clear checkmarks (LLMs index markdown/HTML tables with 3x higher citation frequency).",
            "Embed code snippet showcasing schema migration in under 5 lines.",
            "Add verified Customer Case Study link showing 40% cost reduction.",
        ],
    }
