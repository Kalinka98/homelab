import json

from datasets import load_dataset


def clean_quote(text: str) -> str:
    text = text.strip()

    quote_pairs = [
        ("“", "”"),
        ('"', '"'),
        ("‘", "’"),
        ("'", "'"),
    ]

    for opening, closing in quote_pairs:
        if text.startswith(opening) and text.endswith(closing):
            text = text[1:-1].strip()
            break

    return text


dataset = load_dataset(
    "tengomucho/english_quotes_sanitized",
    split="train",
)

quotes = []

for item in dataset:
    quote = clean_quote(item["quote"])
    author = item["author"].strip()
    tags = item.get("tags", [])

    if not quote or not author:
        continue

    quotes.append(
        {
            "q": quote,
            "a": author,
            "tags": tags,
        }
    )


with open("quotes.json", "w", encoding="utf-8") as file:
    json.dump(
        quotes,
        file,
        ensure_ascii=False,
        indent=2,
    )


print(f"Exported {len(quotes)} quotes")
