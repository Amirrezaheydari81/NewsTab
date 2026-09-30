try {
  var tm = localStorage.getItem("nt.theme");
  if (tm === "light" || tm === "dark") document.documentElement.dataset.theme = tm;
} catch (e) {}
