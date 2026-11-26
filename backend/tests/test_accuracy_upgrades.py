import os
import sys
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

# Ensure backend/ is on sys.path for pytest invocation from workspace root or backend/
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.services.hijacker_service import (
    filter_and_score_search_results,
    is_valid_discussion_url,
)
from app.services.llm_runner import extract_grounding_citations
from app.services.scorer import (
    score_audit_citation,
    score_brand_mention,
    score_brand_mention_async,
)


# ==============================================================================
# 1. Zero-False-Positive Brand Disambiguation Tests
# ==============================================================================

def test_common_word_false_positives_rejected():
    text = (
        "To improve your sales pipeline, a linear progression helps close deals on Monday "
        "without adding extra friction to your team's workflow."
    )
    res_linear = score_brand_mention(
        raw_text=text,
        brand_name="Linear",
        brand_domain="linear.app",
        industry="Project Management",
    )
    assert res_linear.mentioned is False
    assert res_linear.rank is None
    assert res_linear.ambiguous is True
    assert len(res_linear.evidence_windows) >= 1

    audit_res = score_audit_citation(
        raw_response=text,
        brand_domain="linear.app",
        competitor_domain="close.com",
        industry="SaaS",
    )
    assert audit_res.brand_mentioned is False
    assert audit_res.brand_rank is None
    assert audit_res.brand_score == 0.0
    assert audit_res.competitor_mentioned is False
    assert audit_res.competitor_score == 0.0


def test_tier1_fast_pass_confirms_bolded_ranked_brand():
    text = (
        "Here are the top engineering tools:\n"
        "1. **Linear** (linear.app) is the top issue tracker for modern product teams.\n"
        "2. **Jira** (atlassian.com) is widely used in large enterprises."
    )
    res = score_brand_mention(
        raw_text=text,
        brand_name="Linear",
        brand_domain="linear.app",
        industry="Project Management",
    )
    assert res.mentioned is True
    assert res.rank == 1
    assert res.ambiguous is False
    assert res.tier_used == 1

    audit_res = score_audit_citation(
        raw_response=text,
        brand_domain="linear.app",
        competitor_domain="atlassian.com",
        industry="Project Management",
    )
    assert audit_res.brand_mentioned is True
    assert audit_res.brand_rank == 1
    assert audit_res.brand_score >= 80.0
    assert audit_res.competitor_mentioned is True
    assert audit_res.competitor_rank == 2


@pytest.mark.asyncio
async def test_tier3_llm_disambiguation_overrides_or_rejects():
    text = "Many teams prefer a linear workflow when managing sprints."
    with patch(
        "app.services.llm_runner.run_structured_json_completion",
        new=AsyncMock(
            return_value={
                "is_brand_actually_recommended": False,
                "is_competitor_recommended": False,
                "sentiment": "neutral",
                "matched_rank_position": None,
                "evidence_snippet": "linear workflow",
            }
        ),
    ):
        res = await score_brand_mention_async(
            raw_text=text,
            brand_name="Linear",
            brand_domain="linear.app",
            industry="Issue Tracking",
        )
        assert res.mentioned is False
        assert res.rank is None
        assert res.tier_used == 3


# ==============================================================================
# 2. Gemini Grounding Citation Extractor Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_grounding_citation_extractor_with_mock_metadata():
    mock_response = SimpleNamespace(
        candidates=[
            SimpleNamespace(
                grounding_metadata=SimpleNamespace(
                    web_search_queries=["best issue tracker for startups 2026", "linear vs jira"],
                    grounding_chunks=[
                        SimpleNamespace(
                            web=SimpleNamespace(
                                uri="https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc123",
                                title="reddit.com",
                            )
                        ),
                        SimpleNamespace(
                            web=SimpleNamespace(
                                uri="https://linear.app/features",
                                title="Linear Features",
                            )
                        ),
                    ],
                )
            )
        ]
    )

    raw_text = (
        "1. **Linear** ([Linear Docs](https://linear.app/features)) is fast.\n"
        "See also [G2 Reviews](https://www.g2.com/products/linear/reviews)."
    )

    with patch(
        "app.services.llm_runner.resolve_grounding_redirect_url",
        new=AsyncMock(
            side_effect=lambda u, client=None: (
                "https://www.reddit.com/r/SaaS/comments/xyz999/best_issue_tracker/"
                if "vertexaisearch.cloud.google.com" in u
                else u
            )
        ),
    ):
        cited_urls, queries = await extract_grounding_citations(mock_response, raw_text=raw_text)

    assert queries == ["best issue tracker for startups 2026", "linear vs jira"]
    domains = [item["domain"] for item in cited_urls]
    assert "reddit.com" in domains
    assert "linear.app" in domains
    assert "g2.com" in domains

    # Ensure linear.app/features wasn't duplicated and kept verified_grounding=True
    linear_entries = [c for c in cited_urls if c["domain"] == "linear.app"]
    assert len(linear_entries) == 1
    assert linear_entries[0]["verified_grounding"] is True

    g2_entries = [c for c in cited_urls if c["domain"] == "g2.com"]
    assert len(g2_entries) == 1
    assert g2_entries[0]["verified_grounding"] is False


# ==============================================================================
# 3. Hijacker Real-Link Regex & Relevance Filter Tests
# ==============================================================================

def test_hijacker_url_regex_filter_rejects_invalid_and_profiles():
    # Valid Reddit & Quora thread URLs
    assert is_valid_discussion_url("https://www.reddit.com/r/SaaS/comments/1abc23/best_crm_tools/") == "reddit"
    assert is_valid_discussion_url("https://old.reddit.com/r/webdev/comments/9xyz12/firebase_alternatives/") == "reddit"
    assert is_valid_discussion_url("https://www.quora.com/What-is-the-best-alternative-to-Firebase") == "quora"

    # Invalid / hallucinated / profile / topic URLs must be rejected
    assert is_valid_discussion_url("https://www.reddit.com/user/some_author/") is None
    assert is_valid_discussion_url("https://www.reddit.com/r/SaaS/") is None
    assert is_valid_discussion_url("https://www.quora.com/profile/John-Doe") is None
    assert is_valid_discussion_url("https://www.quora.com/topic/SaaS") is None
    assert is_valid_discussion_url("https://www.quora.com/search?q=crm") is None
    assert is_valid_discussion_url("https://example.com/fake-reddit-thread") is None

    raw_search_results = [
        {
            "title": "Best alternative to Firebase for Postgres in 2026?",
            "link": "https://www.reddit.com/r/SaaS/comments/1abc23/best_alternative_to_firebase/",
            "snippet": "Looking for a Firebase alternative with SQL support.",
        },
        {
            "title": "Duplicate via old.reddit",
            "link": "https://old.reddit.com/r/SaaS/comments/1abc23/best_alternative_to_firebase/?utm_source=x",
            "snippet": "Duplicate link",
        },
        {
            "title": "User Profile Should Be Filtered",
            "link": "https://www.reddit.com/user/founder123",
            "snippet": "Profile page",
        },
        {
            "title": "Quora Topic Should Be Filtered",
            "link": "https://www.quora.com/topic/Databases",
            "snippet": "Topic page",
        },
        {
            "title": "Firebase vs Supabase for B2B SaaS?",
            "link": "https://www.quora.com/Firebase-vs-Supabase-for-B2B-SaaS",
            "snippet": "Comparing Firebase pricing vs alternatives.",
        },
    ]

    filtered = filter_and_score_search_results(
        raw_results=raw_search_results,
        brand_name="Supabase",
        competitor_name="Firebase",
    )
    assert len(filtered) == 2
    urls = [t["url"] for t in filtered]
    assert "https://www.reddit.com/r/SaaS/comments/1abc23/best_alternative_to_firebase/" in urls
    assert "https://www.quora.com/Firebase-vs-Supabase-for-B2B-SaaS/" in urls
    # First thread has Firebase mentioned and Supabase NOT mentioned -> high score
    assert filtered[0]["relevance_score"] >= 80
