"""Set public URLs after GitHub Pages resolves the repository's base URL."""
from html import escape
from pathlib import Path
from urllib.parse import urlsplit
import os
import re

url = os.environ["PAGES_BASE_URL"].rstrip("/")
if urlsplit(url).scheme != "https" or not urlsplit(url).netloc:
    raise ValueError("PAGES_BASE_URL must be an absolute HTTPS URL")
base = escape(url, quote=True)

for route, image in (
    ("", "assets/social.jpg"),
    ("modern/", "media/social.jpg"),
):
    page = Path("dist") / route / "index.html"
    public_url = f"{base}/{route}"
    html = page.read_text(encoding="utf-8")
    html = re.sub(r'\n<link rel="canonical" [^>]*>|\n<meta property="og:url" [^>]*>', "", html)
    html = html.replace(
        '<meta property="og:type" content="website">',
        f'<meta property="og:type" content="website">\n'
        f'<meta property="og:url" content="{public_url}">\n'
        f'<link rel="canonical" href="{public_url}">',
    )
    html = re.sub(
        r'<meta property="og:image" content="[^"]+">',
        f'<meta property="og:image" content="{public_url}{image}">',
        html,
    )
    page.write_text(html, encoding="utf-8")
