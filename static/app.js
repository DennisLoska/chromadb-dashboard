(function () {
  const html = document.documentElement;
  const sunIcon = document.getElementById("theme-icon-sun");
  const moonIcon = document.getElementById("theme-icon-moon");

  const savedTheme = sessionStorage.getItem("chromadb-theme");
  if (savedTheme) {
    html.setAttribute("data-theme", savedTheme);
    updateIcons(savedTheme);
  } else {
    html.setAttribute("data-theme", "dracula");
  }

  window.toggleTheme = function () {
    const current = html.getAttribute("data-theme");
    const next = current === "dracula" ? "bumblebee" : "dracula";
    html.setAttribute("data-theme", next);
    sessionStorage.setItem("chromadb-theme", next);
    updateIcons(next);
  };

  function updateIcons(theme) {
    if (theme === "dracula") {
      sunIcon?.classList.remove("hidden");
      moonIcon?.classList.add("hidden");
    } else {
      sunIcon?.classList.add("hidden");
      moonIcon?.classList.remove("hidden");
    }
  }
})();
