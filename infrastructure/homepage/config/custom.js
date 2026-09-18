/* Kalinka's small presentation layer. Search, weather and service data remain
 * Homepage widgets; no credentials, external scripts or extra API calls here. */
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
      subtitle.textContent = "A little order in your digital world.";
      masthead.append(emblem, title, subtitle);
      widgets.before(masthead);
    }

    const sectionNotes = {
      Everyday: "Your daily destinations",
      "At a glance": "The things worth keeping an eye on",
      Media: "For your next quiet evening",
      "Behind the scenes": "The little things that keep it all running",
    };
    document.querySelectorAll(".services-group, .bookmark-group").forEach((group) => {
      const heading = group.querySelector("h2");
      const name = heading?.textContent.trim();
      if (sectionNotes[name] && !group.dataset.kalinkaSection) {
        group.dataset.kalinkaSection = name;
        // A tooltip adds context without crowding the smaller layouts.
        heading.title = sectionNotes[name];
      }
    });

    // Logo-only links retain names for assistive technology and hover tooltips.
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

  // Homepage loads widgets asynchronously and can rebuild them on revalidation.
  // Only add our own elements; never replace React-owned widget content.
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
