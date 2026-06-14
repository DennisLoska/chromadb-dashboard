// Minimal helpers
var $ = document.getElementById.bind(document);
var qs = document.querySelector.bind(document);

// ── Theme ──────────────────────────────────────────
(function() {
  var html = document.documentElement;
  var sunIcon = $("theme-icon-sun");
  var moonIcon = $("theme-icon-moon");

  function updateIcons(theme) {
    if (!sunIcon || !moonIcon) return;
    if (theme === "dracula") {
      sunIcon.classList.remove("hidden");
      moonIcon.classList.add("hidden");
    } else {
      sunIcon.classList.add("hidden");
      moonIcon.classList.remove("hidden");
    }
  }

  var savedTheme;
  try { savedTheme = sessionStorage.getItem("chromadb-theme"); } catch (_) {}
  if (savedTheme) {
    html.setAttribute("data-theme", savedTheme);
    updateIcons(savedTheme);
  } else {
    html.setAttribute("data-theme", "dracula");
    try { sessionStorage.setItem("chromadb-theme", "dracula"); } catch (_) {}
    updateIcons("dracula");
  }

  window.toggleTheme = function() {
    var current = html.getAttribute("data-theme") || "dracula";
    var next = current === "dracula" ? "bumblebee" : "dracula";
    html.setAttribute("data-theme", next);
    try { sessionStorage.setItem("chromadb-theme", next); } catch (_) {}
    updateIcons(next);
  };
})();

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
function copyDone(btn) {
  var orig = btn.textContent;
  btn.textContent = "Copied!";
  setTimeout(function() { btn.textContent = orig; }, 1500);
}

function copyFail(btn) {
  var orig = btn.textContent;
  btn.textContent = "Failed!";
  setTimeout(function() { btn.textContent = orig; }, 1500);
}

function copyExec(text, btn) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  var ok;
  try {
    ok = document.execCommand("copy");
  } catch (_) {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

document.addEventListener("click", function(e) {
  var btn = e.target.closest("[data-copy-for]");
  if (!btn) return;
  var targetId = btn.getAttribute("data-copy-for");
  var el = $(targetId);
  if (!el) return;
  var text = el.textContent || "";
  if (copyExec(text, btn)) {
    copyDone(btn);
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      copyDone(btn);
    }).catch(function() {
      copyFail(btn);
    });
  } else {
    copyFail(btn);
  }
});

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
