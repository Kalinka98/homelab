(() => {
  if (window.kalinkaTheme) return;
  window.kalinkaTheme = true;

  function decorate() {
    const widgets = document.getElementById("information-widgets");
    if (!widgets) return;

    if (!document.getElementById("kalinka-masthead")) {
      const masthead = document.createElement("header");
      masthead.id = "kalinka-masthead";
      const emblem = document.createElement("div");
      emblem.className = "kalinka-emblem";
      emblem.setAttribute("role", "img");
      emblem.setAttribute("aria-label", "Kalinka gold ladybird emblem");
      const title = document.createElement("h1");
      title.textContent = "Kalinka";
      const subtitle = document.createElement("p");
      subtitle.className = "kalinka-subtitle";
      subtitle.textContent = "Don't be the best. Be the only.";
      masthead.append(emblem, title, subtitle);
      widgets.before(masthead);
    }

    document.querySelectorAll(".services-group, .bookmark-group").forEach((group) => {
      const name = group.querySelector("h2")?.textContent.trim();
      if (name && group.dataset.kalinkaSection !== name) {
        group.dataset.kalinkaSection = name;
      }
    });

    document.querySelectorAll(".bookmark > a").forEach((link) => {
      const name = link.closest(".bookmark")?.dataset.name;
      if (name && link.getAttribute("aria-label") !== name) {
        link.setAttribute("aria-label", name);
      }
    });

    const search = widgets.querySelector('input[type="text"]');
    if (search && search.placeholder !== "Search the web…") {
      search.placeholder = "Search the web…";
      search.setAttribute("aria-label", "Search the web with Google");
    }

    const footer = document.getElementById("footer");
    if (footer && !document.getElementById("kalinka-signature")) {
      const signature = document.createElement("p");
      signature.id = "kalinka-signature";
      signature.textContent = "KALINKA";
      footer.prepend(signature);
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
})();
