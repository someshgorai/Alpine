#!/usr/bin/env python3
"""
playwright_scraper.py

A Playwright-based web scraper designed to find and download tender documents (PDFs)
from a specified URL. It uses keyword and date-based filtering to identify relevant
documents from the last few months.

Usage:
    python playwright_scraper.py --url "https://nitjsr.ac.in/Tender/All_Tenders" --headless

This script will:
1. Navigate to the provided URL.
2. Search for links and buttons that might lead to PDF documents.
3. For each potential document, it checks the surrounding text for keywords and recent dates.
4. If the criteria are met, it downloads the PDF.
5. Finally, it creates a `scraped_rfps_manifest.json` file listing all downloaded files.
"""

import os
import time
import json
import argparse
import logging
import re
from typing import List, Dict, Optional
from urllib.parse import urljoin, urlparse
from datetime import datetime, timedelta

import requests
from playwright.sync_api import sync_playwright, Page

# ---------- CONFIGURATION ----------
DEFAULT_DOWNLOAD_DIR = "data/raw"
MANIFEST_PATH = "scraped_rfps_manifest.json"
DEFAULT_TIMEOUT_MS = 20000

# Selectors to wait for on the page, indicating it has likely loaded.
# Add selectors relevant to your target site.
DEFAULT_WAIT_SELECTOR_LIST = [
    ".tender-card", ".tender-item", ".tender-row", ".tender-list", ".notice-card",
    "table", ".list-group", "div.notice"
]

# Keywords to identify relevant tenders. The script is case-insensitive.
# Edit this list to match the terms used on your target procurement portal.
KEYWORDS = [
    "tender", "procurement", "gem", "notice inviting tender", "nit",
    "corrigendum", "e-tender", "invitation for bids", "ifb",
    "request for proposal", "rfp", "supply of", "installation of",
    "lit night", "extension", "open pan evaporimeter", "evaporimeter",
    "rain gauge", "self recording", "siphoning", "rainfall simulator",
    "matlab", "fpga development", "programmable dc power supply",
    "regenerative ac electronic load", "device characterization",
    "ftir spectrometer", "fourier transform infra red"
]

# Timeframe for relevant tenders (e.g., download tenders published in the last 3 months).
DATE_MONTHS_THRESHOLD = 3
# -------------------------------------

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s]: %(message)s")
logger = logging.getLogger("playwright_scraper")


# ------------------ Utility Functions ------------------
def ensure_dir(path: str):
    """Create a directory if it doesn't exist."""
    if not path:
        return
    os.makedirs(path, exist_ok=True)


def filename_from_url(url: str) -> str:
    """Generate a safe filename from a URL."""
    p = urlparse(url).path
    name = os.path.basename(p)
    if not name:
        name = f"rfp_{int(time.time())}.pdf"
    if not name.lower().endswith(".pdf"):
        name = name + ".pdf"
    # Sanitize filename
    return re.sub(r'[\\/*?:"<>|]', "", name)


def save_manifest(manifest: List[Dict], path: str = MANIFEST_PATH):
    """Save the list of downloaded files to a JSON manifest."""
    ensure_dir(os.path.dirname(path) or ".")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    logger.info(f"Manifest saved with {len(manifest)} entries -> {path}")


def download_file_requests(url: str, out_dir: str, headers: dict = None, max_retries: int = 3) -> Optional[str]:
    """Fallback downloader using the requests library."""
    ensure_dir(out_dir)
    headers = headers or {"User-Agent": "Alpine-Scraper/1.0"}
    fname = filename_from_url(url)
    out_path = os.path.join(out_dir, fname)
    if os.path.exists(out_path):
        logger.info(f"(requests) File already exists, skipping: {out_path}")
        return out_path

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"(requests) Downloading {url} (attempt {attempt})")
            with requests.get(url, headers=headers, timeout=30, stream=True) as r:
                r.raise_for_status()
                with open(out_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
            logger.info(f"(requests) Saved -> {out_path}")
            return out_path
        except Exception as e:
            logger.warning(f"(requests) Attempt {attempt} failed for {url}: {e}")
            time.sleep(0.5 + attempt * 0.5)

    logger.error(f"(requests) Failed to download {url} after {max_retries} attempts.")
    return None


# ------------------ Date Extraction & Filtering ------------------
def extract_dates_from_text(text: str) -> List[datetime]:
    """Extract dates from text using common formats."""
    if not text:
        return []

    patterns = [
        r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",  # dd/mm/yyyy or dd-mm-yy
        r"\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b",  # yyyy-mm-dd
        r"\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[.,]?\s+\d{4}\b",  # 12 Jan 2025
        r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b",  # January 12, 2025
    ]

    found_dates = []
    for p in patterns:
        for match in re.finditer(p, text, flags=re.IGNORECASE):
            date_str = match.group(0).strip().replace(".", "").replace(",", "")
            for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%Y/%m/%d", "%d %b %Y", "%d %B %Y", "%B %d %Y", "%b %d %Y",
                        "%d/%m/%y", "%d-%m-%y"):
                try:
                    dt = datetime.strptime(date_str, fmt)
                    # Handle two-digit years
                    if dt.year > datetime.now().year + 1:
                        dt = dt.replace(year=dt.year - 100)
                    found_dates.append(dt)
                    break
                except ValueError:
                    continue

    return sorted(list(set(found_dates)), reverse=True)


def is_within_last_n_months(dates: List[datetime], months: int) -> bool:
    """Check if any date in the list is within the last N months."""
    if not dates:
        return False  # If no date is found, we can't confirm it's recent.
    cutoff = datetime.now() - timedelta(days=30 * months)
    return any(d >= cutoff for d in dates)


# ------------------ DOM Context Extraction ------------------
def get_element_context(page: Page, element_js_locator: str) -> str:
    """Get text context around a DOM element by traversing up the tree."""
    js_function = f"""
    (elementLocator) => {{
      try {{
        const el = eval(elementLocator);
        if (!el) return "";

        let current = el;
        let depth = 0;
        // Find the most relevant parent, likely a row or card
        while (current.parentElement && depth < 5) {{
            const parent = current.parentElement;
            const tagName = parent.tagName.toLowerCase();
            const classList = (parent.getAttribute('class') || '').toLowerCase();
            // Heuristics for a good container: table rows, list items, cards, etc.
            if (tagName === 'tr' || tagName === 'li' || classList.includes('row') || classList.includes('card') || classList.includes('item')) {{
                const text = (parent.innerText || parent.textContent || "").trim();
                if (text.length > 50) return text; // Found a good container
            }}
            current = parent;
            depth++;
        }}
        // Fallback to the original element's parent if no good container is found
        return (el.parentElement.innerText || el.parentElement.textContent || "").trim();
      }} catch (e) {{
        return "";
      }}
    }}
    """
    try:
        context_text = page.evaluate(js_function, element_js_locator)
        return re.sub(r'\s+', ' ', context_text).strip()  # Normalize whitespace
    except Exception:
        return ""


# ------------------ Main Scraping Logic ------------------
def run_scrape(start_url: str, download_dir: str, headless: bool, max_candidates: int):
    ensure_dir(download_dir)
    manifest = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=headless)
        context = browser.new_context(accept_downloads=True,
                                      user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        page = context.new_page()

        try:
            logger.info(f"Navigating to {start_url}")
            page.goto(start_url, wait_until="networkidle", timeout=DEFAULT_TIMEOUT_MS)

            # Wait for page to likely be loaded
            logger.info("Waiting for page content to load...")
            page.wait_for_selector(f"text=/{'|'.join(KEYWORDS)}/i", timeout=5000)
        except Exception:
            logger.warning("Could not find keywords on initial load, waiting for a generic selector.")
            try:
                page.wait_for_selector(", ".join(DEFAULT_WAIT_SELECTOR_LIST), timeout=5000)
            except Exception:
                logger.warning("Generic selectors not found, proceeding after a short delay.")
                page.wait_for_timeout(3000)

        # Scroll to load any lazy-loaded content
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(1000)
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(500)

        # Find all potential links
        links = page.query_selector_all("a[href]")
        logger.info(f"Found {len(links)} total links on the page.")

        filtered_links = []
        for i, link in enumerate(links):
            try:
                href = link.get_attribute("href")
                if not href or href.strip() in ('#', 'javascript:void(0);'):
                    continue
                if not ('.pdf' in href.lower() or any(
                        kw in (link.inner_text() or '').lower() for kw in ["view", "download", "details"])):
                    continue

                # Create a stable JS locator for this element
                js_locator = f"document.querySelectorAll('a[href]')[{i}]"
                context_text = get_element_context(page, js_locator)

                if not context_text:
                    context_text = (link.inner_text() or "").strip()

                # Filter by keywords
                if not any(kw.lower() in context_text.lower() for kw in KEYWORDS):
                    continue

                # Filter by date
                dates = extract_dates_from_text(context_text)
                if not is_within_last_n_months(dates, DATE_MONTHS_THRESHOLD):
                    continue

                filtered_links.append({
                    "href": urljoin(start_url, href),
                    "context": context_text,
                    "title": (link.inner_text() or "").strip(),
                    "link_handle": link
                })

                if len(filtered_links) >= max_candidates:
                    break
            except Exception as e:
                logger.debug(f"Error processing link: {e}")
                continue

        logger.info(f"Found {len(filtered_links)} relevant candidates after filtering.")

        # Process and download from filtered links
        for candidate in filtered_links:
            href = candidate["href"]
            if href.lower().endswith(".pdf"):
                path = download_file_requests(href, download_dir)
                if path:
                    manifest.append({
                        "title": candidate["title"],
                        "pdf_url": href,
                        "download_path": path,
                        "context": candidate["context"]
                    })
            else:  # It's a detail page, not a direct PDF link
                logger.info(f"Navigating to detail page: {href}")
                try:
                    with page.expect_navigation(wait_until="networkidle", timeout=10000):
                        candidate["link_handle"].click()

                    detail_page_url = page.url
                    # Find PDF links on the detail page
                    pdf_links = page.query_selector_all("a[href$='.pdf']")
                    if pdf_links:
                        pdf_href = pdf_links[0].get_attribute("href")
                        absolute_pdf_url = urljoin(detail_page_url, pdf_href)
                        path = download_file_requests(absolute_pdf_url, download_dir)
                        if path:
                            manifest.append({
                                "title": candidate["title"],
                                "pdf_url": absolute_pdf_url,
                                "download_path": path,
                                "context": candidate["context"]
                            })
                    else:
                        logger.warning(f"No direct PDF link found on detail page: {detail_page_url}")

                    # Go back to the main list page to continue
                    page.go_back(wait_until="networkidle")

                except Exception as e:
                    logger.error(f"Failed to process detail page {href}: {e}")
                    # If navigation fails, try to go back or reload the start page
                    try:
                        page.goto(start_url, wait_until="networkidle")
                    except Exception:
                        logger.error("Failed to return to start URL. Aborting.")
                        break

        context.close()
        browser.close()

    # Deduplicate and save manifest
    seen_urls = set()
    final_manifest = []
    for entry in manifest:
        url_key = entry["pdf_url"]
        if url_key not in seen_urls:
            final_manifest.append(entry)
            seen_urls.add(url_key)

    save_manifest(final_manifest, MANIFEST_PATH)
    return final_manifest


def main():
    parser = argparse.ArgumentParser(description="Playwright RFP scraper with keyword and date filtering.")
    parser.add_argument("--url", "-u", required=True, help="Tender listing page URL to scrape.")
    parser.add_argument("--download-dir", "-d", default=DEFAULT_DOWNLOAD_DIR, help="Directory to save downloaded PDFs.")
    parser.add_argument("--headless", action="store_true", help="Run the browser in headless mode.")
    parser.add_argument("--max-candidates", type=int, default=50,
                        help="Maximum number of relevant tender documents to download.")
    args = parser.parse_args()

    results = run_scrape(
        start_url=args.url,
        download_dir=args.download_dir,
        headless=args.headless,
        max_candidates=args.max_candidates
    )
    print(f"\nScraping complete. Downloaded {len(results)} new PDF(s).")
    print(f"Manifest file created at: {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
