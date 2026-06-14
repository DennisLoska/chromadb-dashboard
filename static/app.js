(function () {
  var html = document.documentElement;

  function get(id) { return document.getElementById(id); }

  function loadSavedTheme() {
    try { return sessionStorage.getItem("chromadb-theme"); } catch (e) { return null; }
  }

  function saveTheme(t) {
    try { sessionStorage.setItem("chromadb-theme", t); } catch (e) {}
  }

  function updateIcons(theme) {
    var sun = get("theme-icon-sun");
    var moon = get("theme-icon-moon");
    if (!sun || !moon) return;
    if (theme === "dracula") {
      sun.classList.remove("hidden");
      moon.classList.add("hidden");
    } else {
      sun.classList.add("hidden");
      moon.classList.remove("hidden");
    }
  }

  var saved = loadSavedTheme();
  if (saved) {
    html.setAttribute("data-theme", saved);
    updateIcons(saved);
  } else {
    html.setAttribute("data-theme", "dracula");
  }

  window.toggleTheme = function () {
    var cur = html.getAttribute("data-theme");
    var next = cur === "dracula" ? "bumblebee" : "dracula";
    html.setAttribute("data-theme", next);
    saveTheme(next);
    updateIcons(next);
  };

  var toggle = get("main-drawer");
  if (toggle) {
    toggle.checked = window.matchMedia("(min-width: 1024px)").matches;
  }

  window.toggleSidebar = function () {
    if (toggle) toggle.checked = !toggle.checked;
  };

  window.showRecord = function (data) {
    var idEl = get("modal-id");
    var docEl = get("modal-document");
    var metaEl = get("modal-metadata");
    var modal = get("record-modal");
    if (!idEl || !docEl || !metaEl || !modal) return;
    idEl.textContent = data.id;
    docEl.textContent = data.document || "(null)";
    try {
      var mo = JSON.parse(data.metadata);
      if (mo && Object.keys(mo).length > 0) {
        metaEl.textContent = JSON.stringify(mo, null, 2);
      } else {
        metaEl.textContent = "(none)";
      }
    } catch (e) {
      metaEl.textContent = data.metadata || "(none)";
    }
    modal.showModal();
  };

  window.copyContent = function (id) {
    var el = get(id);
    if (!el) return;
    var text = el.textContent;
    navigator.clipboard.writeText(text).then(function () {
      var btns = document.querySelectorAll("[onclick*=\"copyContent('" + id + "')\"]");
      btns.forEach(function (btn) {
        var orig = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(function () { btn.textContent = orig; }, 2000);
      });
    });
  };

  var resizeState = null;

  function initColumnResize() {
    var table = get("records-table");
    if (!table) return;
    var cols = table.querySelectorAll("colgroup col");
    if (cols.length === 0) return;
    var handles = table.querySelectorAll("thead th .resize-handle");
    handles.forEach(function (handle) {
      handle.addEventListener("mousedown", function (e) {
        e.preventDefault();
        var th = handle.parentElement;
        var ths = Array.from(th.parentElement.children);
        var colIndex = ths.indexOf(th);
        if (colIndex < 0 || colIndex >= cols.length) return;
        var startW = cols[colIndex].offsetWidth;
        handle.classList.add("resizing");
        resizeState = {
          colIndex: colIndex,
          startX: e.clientX,
          startWidth: startW,
          handle: handle,
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });
    });
  }

  function onMouseMove(e) {
    if (!resizeState) return;
    var diff = e.clientX - resizeState.startX;
    var newWidth = Math.max(40, resizeState.startWidth + diff);
    var col = document.querySelector("#records-table colgroup col:nth-child(" + (resizeState.colIndex + 1) + ")");
    if (col) col.style.width = newWidth + "px";
  }

  function onMouseUp() {
    if (resizeState && resizeState.handle) {
      resizeState.handle.classList.remove("resizing");
    }
    resizeState = null;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("#theme-toggle");
    if (btn) {
      window.toggleTheme();
      return;
    }
    if (e.target.closest("[onclick*='stopPropagation']")) return;
  });

  initColumnResize();

  document.addEventListener("htmx:afterSwap", function () {
    initColumnResize();
  });
})();
