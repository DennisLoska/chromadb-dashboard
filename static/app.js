(function () {
  var html = document.documentElement;
  var body = document.body;

  function get(id) { return document.getElementById(id); }

  function loadSavedTheme() {
    try { return sessionStorage.getItem("chromadb-theme"); } catch (e) { return null; }
  }

  function saveTheme(t) {
    try { sessionStorage.setItem("chromadb-theme", t); } catch (e) {}
  }

  function setTheme(t) {
    html.setAttribute("data-theme", t);
    saveTheme(t);
    var sun = get("theme-icon-sun");
    var moon = get("theme-icon-moon");
    if (sun && moon) {
      if (t === "dracula") {
        sun.classList.remove("hidden");
        moon.classList.add("hidden");
      } else {
        sun.classList.add("hidden");
        moon.classList.remove("hidden");
      }
    }
  }

  var saved = loadSavedTheme();
  setTheme(saved || "dracula");

  window.toggleTheme = function () {
    var cur = html.getAttribute("data-theme");
    setTheme(cur === "dracula" ? "bumblebee" : "dracula");
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

  document.addEventListener("click", function (e) {
    var copyBtn = e.target.closest("[data-copy-for]");
    if (copyBtn) {
      var targetId = copyBtn.getAttribute("data-copy-for");
      var el = get(targetId);
      if (!el) return;
      navigator.clipboard.writeText(el.textContent).then(function () {
        var orig = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(function () { copyBtn.textContent = orig; }, 2000);
      });
      return;
    }
    if (e.target.closest("[onclick*='stopPropagation']")) return;
  });

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

  initColumnResize();

  document.addEventListener("htmx:afterSwap", function () {
    initColumnResize();
  });
})();
