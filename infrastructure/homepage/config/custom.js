(() => {
  if (window.kalinkaTheme) return;
  window.kalinkaTheme = true;

  async function getJSON(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: "omit", cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  const quoteCacheKey = "kalinka.daily-quote.v1";
  let dailyQuote = null;
  let quoteLoading = false;
  let quoteFailed = false;
  let nextQuoteRetry = 0;

  function validQuote(quote) {
    return typeof quote?.text === "string" && quote.text.trim() &&
      typeof quote.author === "string" && quote.author.trim() &&
      quote.author.trim().toLowerCase() !== "zenquotes.io";
  }

  try {
    const saved = JSON.parse(localStorage.getItem(quoteCacheKey));
    if (validQuote(saved) && Number.isInteger(saved.day)) dailyQuote = saved;
  } catch {}

  function quoteDay() {
    const now = new Date();
    return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  }

  function renderQuote() {
    const quote = document.querySelector(".kalinka-quote-text");
    if (!quote) return;
    const text = dailyQuote ? `“${dailyQuote.text}”` :
      quoteFailed ? "Today’s quote is temporarily unavailable." : "Loading today’s quote…";
    const author = document.querySelector(".kalinka-quote-author");
    const authorText = dailyQuote ? `— ${dailyQuote.author}` : "";
    const status = document.querySelector(".kalinka-quote-status");
    const statusText = quoteFailed && dailyQuote ? "Showing the last saved quote. We’ll try again shortly." : "";
    if (quote.textContent !== text) quote.textContent = text;
    if (author.textContent !== authorText) author.textContent = authorText;
    if (status.textContent !== statusText) status.textContent = statusText;
  }

  async function updateQuote() {
    renderQuote();
    if (document.hidden || quoteLoading || dailyQuote?.day === quoteDay() || Date.now() < nextQuoteRetry) return;
    quoteLoading = true;
    const day = quoteDay();
    try {
      const data = await getJSON("/api/daily-quote");
      const result = { text: data?.[0]?.q, author: data?.[0]?.a, day };
      if (!validQuote(result)) throw new Error("Incomplete quote");
      dailyQuote = { ...result, text: result.text.trim(), author: result.author.trim() };
      quoteFailed = false;
      nextQuoteRetry = 0;
      try { localStorage.setItem(quoteCacheKey, JSON.stringify(dailyQuote)); } catch {}
    } catch {
      quoteFailed = true;
      nextQuoteRetry = Date.now() + 5 * 60 * 1000;
    } finally {
      quoteLoading = false;
      renderQuote();
    }
  }

  function mountQuote() {
    const widgets = document.getElementById("information-widgets");
    if (!widgets) return;
    observer.disconnect();
    const quote = document.createElement("div");
    quote.id = "kalinka-quote";
    quote.innerHTML = `
      <blockquote class="kalinka-quote-text"></blockquote>
      <p class="kalinka-quote-author"></p>
      <p class="kalinka-quote-status"></p>`;
    widgets.after(quote);
    updateQuote();
  }

  const observer = new MutationObserver(mountQuote);
  observer.observe(document.body, { childList: true, subtree: true });
  mountQuote();
  setInterval(updateQuote, 60000);
  document.addEventListener("visibilitychange", updateQuote);
  window.addEventListener("online", () => {
    nextQuoteRetry = 0;
    updateQuote();
  });
})();
