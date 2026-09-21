import json
from datetime import datetime
from hashlib import sha256
from html import escape
from pathlib import Path
from zoneinfo import ZoneInfo

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse

app = FastAPI()

QUOTES_FILE = Path("/app/quotes.json")

TIMEZONE = ZoneInfo("Europe/Sofia")

MIN_LENGTH = 0
MAX_LENGTH = 240


def load_quotes():
    with QUOTES_FILE.open("r", encoding="utf-8") as file:
        raw_quotes = json.load(file)

    quotes = []

    for item in raw_quotes:
        quote = item.get("q", "").strip()
        author = item.get("a", "").strip()
        tags = item.get("tags", [])

        if not quote or not author:
            continue

        if not MIN_LENGTH <= len(quote) <= MAX_LENGTH:
            continue

        quotes.append(
            {
                "q": quote,
                "a": author,
                "tags": tags,
            }
        )

    return quotes


quotes = load_quotes()


def get_daily_quote():
    if not quotes:
        return {
            "q": "No suitable quotes found.",
            "a": "Quote Service",
            "tags": [],
        }

    today = datetime.now(TIMEZONE).date().isoformat()

    digest = sha256(today.encode()).hexdigest()

    index = int(digest[:8], 16) % len(quotes)

    return quotes[index]


@app.get("/health")
def health():
    return {
        "status": "ok",
        "quotes": len(quotes),
    }


@app.get("/api/today")
def api_today():
    return JSONResponse(get_daily_quote())


@app.get("/", response_class=HTMLResponse)
def homepage():
    quote = get_daily_quote()

    quote_text = escape(quote["q"])
    author = escape(quote["a"])

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Daily Inspiration</title>

    <style>
        * {{
            box-sizing: border-box;
        }}

        html,
        body {{
            width: 100%;
            height: 100%;
            margin: 0;
        }}

        body {{
            display: flex;
            align-items: center;
            justify-content: center;

            padding: 14px 22px;

            background: transparent;

            color: #f2eadb;

            font-family:
                Georgia,
                "Times New Roman",
                serif;
        }}

        .container {{
            width: 100%;
            max-width: 1000px;
        }}

        .label {{
            margin-bottom: 8px;

            color: #d7b577;

            font-family:
                system-ui,
                -apple-system,
                sans-serif;

            font-size: 9px;
            font-weight: 700;

            letter-spacing: 1.4px;

            text-transform: uppercase;
        }}

        .quote {{
            font-size: clamp(15px, 1.4vw, 20px);

            font-style: italic;
            font-weight: 500;

            line-height: 1.45;

            text-align: center;
        }}

        .author {{
            margin-top: 10px;

            color: #d7b577;

            font-size: 12px;

            text-align: right;
        }}

        .mark {{
            color: #d7b577;
        }}
    </style>
</head>

<body>
    <div class="container">

        <div class="quote">
            <span class="mark">“</span>{quote_text}<span class="mark">”</span>
        </div>

        <div class="author">
            — {author}
        </div>

    </div>

    <script>

        function reloadAtMidnight() {{
            const now = new Date();

            const next = new Date(now);
            next.setHours(24, 0, 5, 0);

            setTimeout(
                () => window.location.reload(),
                next - now
            );
        }}

        reloadAtMidnight();
    </script>
</body>
</html>
"""
