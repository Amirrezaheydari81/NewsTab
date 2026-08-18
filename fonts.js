(function injectVazirmatn() {
  const files = [
    ["fonts/Vazir.woff2", 400],
    ["fonts/Vazir-Medium.woff2", 500],
    ["fonts/Vazir-Bold.woff2", 700],
  ];
  const urlOf = (file) => {
    try {
      return chrome.runtime.getURL(file);
    } catch {
      return file;
    }
  };
  const css = files
    .map(
      ([file, weight]) =>
        `@font-face{font-family:"Vazirmatn";src:url("${urlOf(file)}") format("woff2");font-weight:${weight};font-style:normal;font-display:swap;}`
    )
    .join("");
  const el = document.createElement("style");
  el.setAttribute("data-font", "vazirmatn");
  el.textContent = css;
  document.documentElement.appendChild(el);
})();
