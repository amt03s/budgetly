const toggle = document.getElementById("darkToggle");

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    if (toggle) toggle.checked = true;
  } else {
    document.documentElement.classList.remove("dark");
    if (toggle) toggle.checked = false;
  }
}

const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

if (toggle) {
  toggle.addEventListener("change", () => {

    const theme = toggle.checked ? "dark" : "light";

    localStorage.setItem("theme", theme);

    applyTheme(theme);

  });
}