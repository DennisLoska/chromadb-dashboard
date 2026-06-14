// Minimal helpers
var $ = document.getElementById.bind(document);
var qs = document.querySelector.bind(document);

// ── Theme ──────────────────────────────────────────
(function() {
  var html = document.documentElement;
  var cur = html.getAttribute("data-theme") || "dracula";
  var saved;
  try { saved = sessionStorage.getItem("chromadb-theme"); } catch (_) {}
  if (saved) {
    html.setAttribute("data-theme", saved);
    cur = saved;
  } else {
    html.setAttribute("data-theme", "dracula");
    try { sessionStorage.setItem("chromadb-theme", "dracula"); } catch (_) {}
  }
  updateIcons(cur);
})();

function updateIcons(theme) {
  var sun = $("theme-icon-sun");
  var moon = $("theme-icon-moon");
  if (!sun || !moon) return;
  if (theme === "dracula") {
    sun.classList.remove("hidden");
    moon.classList.add("hidden");
  } else {
    sun.classList.add("hidden");
    moon.classList.remove("hidden");
  }
}

// Theme toggle via event delegation (no inline onclick fragile)
document.addEventListener("click", function(e) {
  var btn = e.target.closest("#theme-toggle");
  if (!btn) return;
  var html = document.documentElement;
  var cur = html.getAttribute("data-theme") || "dracula";
  var next = cur === "dracula" ? "bumblebee" : "dracula";
  html.setAttribute("data-theme", next);
  try { sessionStorage.setItem("chromadb-theme", next); } catch (_) {}
  updateIcons(next);
});

// ── Sidebar ────────────────────────────────────────
function toggleSidebar() {
  var drawer = $("app-drawer");
  if (!drawer) return;
  var open = drawer.getAttribute("data-sidebar-open") === "true";
  drawer.setAttribute("data-sidebar-open", open ? "false" : "true");

  var sidebar = $("sidebar");
  if (sidebar) sidebar.setAttribute("data-open", open ? "false" : "true");

  var overlay = $("sidebar-overlay");
  if (overlay) {
    overlay.classList.toggle("hidden", open);
  }
}

document.addEventListener("click", function(e) {
  var btn = e.target.closest("#sidebar-toggle-mobile, #sidebar-toggle-desktop");
  if (btn) { e.preventDefault(); toggleSidebar(); }
  var overlay = e.target.closest("#sidebar-overlay");
  if (overlay) toggleSidebar();
});

// Default sidebar state
(function() {
  var drawer = $("app-drawer");
  if (!drawer) return;
  var wide = window.matchMedia("(min-width: 1024px)").matches;
  drawer.setAttribute("data-sidebar-open", wide ? "true" : "false");
  var sidebar = $("sidebar");
  if (sidebar) sidebar.setAttribute("data-open", wide ? "true" : "false");
})();

// ── Column Resize ──────────────────────────────────
(function() {
  var resizing = false, startX, startW, curTh;

  document.addEventListener("mousedown", function(e) {
    var handle = e.target.closest(".resize-handle");
    if (!handle) return;
    curTh = handle.parentElement;
    resizing = true;
    startX = e.clientX;
    startW = curTh.offsetWidth;
    document.body.classList.add("select-none", "resizing");
    e.preventDefault();
  });

  document.addEventListener("mousemove", function(e) {
    if (!resizing || !curTh) return;
    var w = Math.max(60, startW + (e.clientX - startX));
    curTh.style.width = w + "px";
  });

  document.addEventListener("mouseup", function() {
    if (!resizing) return;
    resizing = false;
    curTh = null;
    document.body.classList.remove("select-none", "resizing");
  });
})();

// ── Copy to clipboard with event delegation ────────
document.addEventListener("click", function(e) {
  var btn = e.target.closest("[data-copy-for]");
  if (!btn) return;
  var targetId = btn.getAttribute("data-copy-for");
  var el = $(targetId);
  if (!el) return;
  var text = el.textContent || "";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      var orig = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(function() { btn.textContent = orig; }, 1500);
    }).catch(function() {
      fallbackCopy(text, btn);
    });
  } else {
    fallbackCopy(text, btn);
  }
});

function fallbackCopy(text, btn) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try {
    var orig = btn.textContent;
    document.execCommand("copy");
    btn.textContent = "Copied!";
    setTimeout(function() { btn.textContent = orig; }, 1500);
  } catch (_) {}
  document.body.removeChild(ta);
}

// ── Record Modal ───────────────────────────────────
window.showRecord = function(data) {
  var modal = $("record-modal");
  if (!modal) return;
  var el, val;
  el = $("modal-id"); if (el) el.textContent = data.id || "(null)";
  el = $("modal-document"); if (el) el.textContent = data.document || "(null)";
  el = $("modal-metadata"); if (el) {
    try { val = JSON.stringify(JSON.parse(data.metadata), null, 2); } catch (_) { val = data.metadata || "(null)"; }
    el.textContent = val;
  }
  modal.showModal();
};

// ── HTMX init ─────────────────────────────────────
document.addEventListener("htmx:afterSwap", function() {
  var drawer = $("app-drawer");
  if (drawer && window.matchMedia("(min-width: 1024px)").matches) {
    drawer.setAttribute("data-sidebar-open", "true");
    var sidebar = $("sidebar");
    if (sidebar) sidebar.setAttribute("data-open", "true");
  }
});
