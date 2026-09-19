(() => {
  if (window.kalinkaTheme) return;
  window.kalinkaTheme = true;

  function element(tag, className = "", text = "") {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }

  async function getJSON(url, controller = new AbortController(), timeout = 10000) {
    const timer = setTimeout(() => controller.abort(), timeout);
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

  const forecastFields = ["weather_code", "temperature_2m_max", "temperature_2m_min", "precipitation_probability_max"];
  let weatherOptions = null;
  let forecast = null;
  let forecastRequest = null;
  let forecastError = false;
  let nextForecastRefresh = 0;
  let requestedDay = "";

  function weatherDay() {
    const timeZone = forecast?.timezone || (weatherOptions?.timezone !== "auto" ? weatherOptions?.timezone : undefined);
    const parts = new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date());
    return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type).value).join("-");
  }

  function weatherCondition(code) {
    if (code === 0) return ["Clear sky", "sun"];
    if (code === 1) return ["Mostly clear", "sun"];
    if (code === 2) return ["Partly cloudy", "cloud"];
    if (code === 3) return ["Overcast", "cloud"];
    if ([45, 48].includes(code)) return ["Fog", "fog"];
    if ([51, 53, 55].includes(code)) return ["Drizzle", "rain"];
    if ([56, 57].includes(code)) return ["Freezing drizzle", "rain"];
    if ([61, 63, 65].includes(code)) return ["Rain", "rain"];
    if ([66, 67].includes(code)) return ["Freezing rain", "rain"];
    if ([71, 73, 75, 77].includes(code)) return ["Snow", "snow"];
    if ([80, 81, 82].includes(code)) return ["Rain showers", "rain"];
    if ([85, 86].includes(code)) return ["Snow showers", "snow"];
    if ([95, 96, 99].includes(code)) return ["Thunderstorms", "storm"];
    return ["Conditions unavailable", "unknown"];
  }

  function weatherIcon(name) {
    const cloud = "M6 16a4 4 0 0 1-.4-8A6 6 0 0 1 17 7a4.5 4.5 0 1 1 .5 9H6";
    const paths = {
      sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5",
      cloud,
      fog: `${cloud}M4 20h16M8 23h8`,
      rain: `${cloud}M8 19l-1 3m6-3-1 3m6-3-1 3`,
      snow: `${cloud}M8 19v4m-2-2h4m6-2v4m-2-2h4`,
      storm: `${cloud}M13 17l-3 4h4l-2 3`,
      unknown: "M8 8a4 4 0 1 1 6 3.5c-2 1-2 2-2 3.5m0 4v.1",
    };
    return `<svg viewBox="0 0 24 26"><path d="${paths[name]}"></path></svg>`;
  }

  function renderForecast() {
    const section = document.getElementById("kalinka-forecast");
    if (!section) return;
    const today = weatherDay();
    section.replaceChildren(element("h2", "kalinka-forecast-heading", "Today & the next 3 days"));

    const start = forecast?.daily.time.indexOf(today) ?? -1;
    const hasFourDays = start >= 0 && forecast.daily.time.length >= start + 4;
    if (hasFourDays) {
      const unit = weatherOptions.units === "imperial" ? "°F" : "°C";
      const temperature = (value) => Number.isFinite(value) ? `${Math.round(value)}${unit}` : "—";
      const days = Array.from({ length: 4 }, (_, offset) => {
        const index = start + offset;
        const label = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" :
          new Date(`${forecast.daily.time[index]}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short" });
        const [condition, icon] = weatherCondition(forecast.daily.weather_code[index]);
        const chance = forecast.daily.precipitation_probability_max[index];
        return `<li class="kalinka-forecast-day">
          <span class="kalinka-forecast-date">${label}</span>
          ${weatherIcon(icon)}
          <div class="kalinka-forecast-temperatures">
            <span class="kalinka-forecast-high">${temperature(forecast.daily.temperature_2m_max[index])}</span>
            <span class="kalinka-forecast-low">${temperature(forecast.daily.temperature_2m_min[index])}</span>
          </div>
          <span class="kalinka-forecast-condition">${condition}</span>
          <span class="kalinka-forecast-rain">${Number.isFinite(chance) ? `${Math.round(chance)}% precip.` : "Precip. unavailable"}</span>
        </li>`;
      });
      section.insertAdjacentHTML("beforeend", `<ol class="kalinka-forecast-days">${days.join("")}</ol>`);
    }

    if (!hasFourDays || forecastError) {
      const message = !weatherOptions ? "Allow location in the weather widget to see your forecast." :
        forecastError ? (hasFourDays ? "Couldn’t refresh the forecast. Showing the last update." : "Forecast is temporarily unavailable.") :
          "Loading your local forecast…";
      const status = element("p", "kalinka-forecast-status", message);
      if (forecastError) {
        const retry = element("button", "kalinka-forecast-retry", "Retry");
        retry.type = "button";
        retry.disabled = Boolean(forecastRequest);
        retry.addEventListener("click", () => refreshForecast(true));
        status.append(retry);
      }
      section.append(status);
    }
  }

  async function refreshForecast(force = false) {
    if (!weatherOptions || forecastRequest || document.hidden) return;
    if (!force && Date.now() < nextForecastRefresh && requestedDay === weatherDay()) return;
    const controller = new AbortController();
    forecastRequest = controller;
    requestedDay = weatherDay();
    renderForecast();
    try {
      const params = new URLSearchParams({
        latitude: weatherOptions.latitude,
        longitude: weatherOptions.longitude,
        timezone: weatherOptions.timezone,
        temperature_unit: weatherOptions.units === "imperial" ? "fahrenheit" : "celsius",
        daily: forecastFields.join(","),
        forecast_days: "4",
      });
      const data = await getJSON(`https://api.open-meteo.com/v1/forecast?${params}`, controller, 15000);
      if (!Array.isArray(data.daily?.time) || data.daily.time.length < 4 ||
        !data.daily.time.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)) ||
        !forecastFields.every((field) => Array.isArray(data.daily[field]) && data.daily[field].length === data.daily.time.length)) {
        throw new Error("Incomplete forecast");
      }
      new Intl.DateTimeFormat("en", { timeZone: data.timezone }).format();
      if (forecastRequest !== controller) return;
      forecast = data;
      forecastError = false;
      requestedDay = weatherDay();
      nextForecastRefresh = Date.now() + 30 * 60 * 1000;
    } catch {
      if (forecastRequest !== controller) return;
      forecastError = true;
      nextForecastRefresh = Date.now() + 5 * 60 * 1000;
    } finally {
      if (forecastRequest === controller) {
        forecastRequest = null;
        renderForecast();
      }
    }
  }

  // Reuse the location selected by Homepage's weather widget.
  function observeWeatherRequest(entry) {
    const url = new URL(entry.name, location.href);
    if (url.origin !== location.origin || url.pathname !== "/api/widgets/openmeteo") return;
    const latitude = url.searchParams.get("latitude");
    const longitude = url.searchParams.get("longitude");
    if (!latitude || !longitude || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) ||
      Math.abs(Number(latitude)) > 90 || Math.abs(Number(longitude)) > 180) return;
    const options = {
      latitude, longitude,
      units: url.searchParams.get("units") === "imperial" ? "imperial" : "metric",
      timezone: url.searchParams.get("timezone") || "auto",
    };
    try {
      if (options.timezone !== "auto") new Intl.DateTimeFormat("en", { timeZone: options.timezone }).format();
    } catch { return; }
    if (JSON.stringify(options) === JSON.stringify(weatherOptions)) return;
    forecastRequest?.abort();
    forecastRequest = null;
    weatherOptions = options;
    forecast = null;
    forecastError = false;
    nextForecastRefresh = 0;
    refreshForecast();
  }

  const weatherObserver = new PerformanceObserver((list) => list.getEntries().forEach(observeWeatherRequest));
  weatherObserver.observe({ type: "resource", buffered: true });

  function decorate() {
    const widgets = document.getElementById("information-widgets");
    if (!widgets) return;

    if (!document.getElementById("kalinka-masthead")) {
      const masthead = element("header");
      masthead.id = "kalinka-masthead";
      masthead.innerHTML = `
        <div class="kalinka-emblem"></div>
        <h1>Kalinka Homelab</h1>
        <div class="kalinka-subtitle">
          <span class="kalinka-quote-label">Daily inspiration</span>
          <blockquote class="kalinka-quote-text"></blockquote>
          <p class="kalinka-quote-author"></p>
          <p class="kalinka-quote-status"></p>
        </div>`;
      widgets.before(masthead);
      updateQuote();
    }

    if (!document.getElementById("kalinka-forecast")) {
      const section = element("section");
      section.id = "kalinka-forecast";
      widgets.after(section);
      renderForecast();
    }

    document.querySelectorAll(".services-group, .bookmark-group").forEach((group) => {
      const name = group.querySelector("h2")?.textContent.trim();
      if (name && group.dataset.kalinkaSection !== name) {
        group.dataset.kalinkaSection = name;
      }
    });

    const search = widgets.querySelector('input[type="text"]');
    if (search && search.placeholder !== "Search the web…") {
      search.placeholder = "Search the web…";
    }
  }

  let pending = false;
  const observer = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      decorate();
    });
  });
  decorate();
  observer.observe(document.body, { childList: true, subtree: true });
  function refreshDailyContent() {
    if (document.hidden) return;
    updateQuote();
    refreshForecast();
    renderForecast();
  }
  setInterval(refreshDailyContent, 60000);
  document.addEventListener("visibilitychange", refreshDailyContent);
  window.addEventListener("online", () => {
    nextQuoteRetry = 0;
    updateQuote();
    refreshForecast(true);
  });
})();
