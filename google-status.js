const GOOGLE_STATUS_API = "https://status.search.google.com/incidents.json";
const GOOGLE_STATUS_BASE = "https://status.search.google.com/";
const GOOGLE_STATUS_TTL_MS = 30 * 60 * 1000;
const GOOGLE_STATUS_LIMIT = 10;
const GOOGLE_TRANSLATE_API =
  "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&dt=t&q=";

const STATUS_LABELS = {
  AVAILABLE: "در دسترس",
  SERVICE_INFORMATION: "اطلاع‌رسانی",
  SERVICE_DISRUPTION: "اختلال",
  SERVICE_OUTAGE: "قطعی",
};

const PRODUCT_LABELS = {
  Ranking: "رتبه‌بندی",
  Crawling: "خزش",
  Indexing: "ایندکس",
  Serving: "نمایش نتایج",
};

const googleStatusList = document.getElementById("googleStatusList");
const googleStatusSection = document.getElementById("googleStatusSection");
const googleStatusOverlay = document.getElementById("googleStatusOverlay");
const googleStatusModalBody = document.getElementById("googleStatusModalBody");
const googleStatusModalClose = document.getElementById("googleStatusModalClose");
const googleStatusNavLeft = document.getElementById("googleStatusNavLeft");
const googleStatusNavRight = document.getElementById("googleStatusNavRight");

let googleStatusCache = { at: 0, items: null };
let googleStatusTranslateCache = {};
let googleStatusPrepared = [];

function safeGoogleHref(url) {
  try {
    const u = new URL(String(url || "").trim());
    return u.protocol === "https:" ? u.toString() : GOOGLE_STATUS_BASE;
  } catch (e) {
    return GOOGLE_STATUS_BASE;
  }
}

function escapeGoogleHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractAngleLinks(text) {
  const urls = [];
  const cleaned = String(text || "").replace(/<((?:https?:\/\/)[^>]+)>/g, (_, url) => {
    urls.push(url.trim());
    return " __LINK_" + urls.length + "__ ";
  });
  return { cleaned: cleaned.replace(/\s+/g, " ").trim(), urls };
}

function restoreAngleLinks(text, urls) {
  let out = escapeGoogleHtml(text);
  urls.forEach((url, i) => {
    const n = i + 1;
    const patterns = [
      new RegExp("__LINK_" + n + "__", "gi"),
      new RegExp("\\[\\[L" + n + "\\]\\]", "gi"),
    ];
    const link =
      '<a href="' +
      escapeGoogleHtml(url) +
      '" target="_blank" rel="noopener noreferrer">منبع</a>';
    patterns.forEach((marker) => {
      out = out.replace(marker, link);
    });
  });
  return out;
}

async function translateGoogleText(text) {
  const key = String(text || "").trim();
  if (!key) return "";
  if (googleStatusTranslateCache[key]) return googleStatusTranslateCache[key];
  try {
    const res = await fetch(GOOGLE_TRANSLATE_API + encodeURIComponent(key));
    const data = await res.json();
    const fa = data[0].map((chunk) => chunk[0]).join("");
    googleStatusTranslateCache[key] = fa;
    return fa;
  } catch {
    return key;
  }
}

async function translateLinkedText(text) {
  const extracted = extractAngleLinks(text || "");
  if (!extracted.cleaned) return "";
  const fa = await translateGoogleText(extracted.cleaned);
  return restoreAngleLinks(fa, extracted.urls);
}

function statusLabel(code) {
  return STATUS_LABELS[code] || "وضعیت";
}

function productLabel(name) {
  return PRODUCT_LABELS[name] || name || "جستجو";
}

function formatGoogleDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatGoogleDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isActiveIncident(item) {
  return !item.end;
}

function pickIncidents(list) {
  const items = Array.isArray(list) ? list.slice() : [];
  items.sort((a, b) => {
    const activeDiff = Number(isActiveIncident(b)) - Number(isActiveIncident(a));
    if (activeDiff) return activeDiff;
    return new Date(b.begin || 0) - new Date(a.begin || 0);
  });
  return items.slice(0, GOOGLE_STATUS_LIMIT);
}

function renderGoogleStatusSkeleton() {
  if (!googleStatusList) return;
  googleStatusList.innerHTML =
    '<div class="google-status-empty google-status-empty--chip">در حال دریافت…</div>';
  updateGoogleStatusNav();
}

function renderGoogleStatusEmpty(message) {
  if (!googleStatusList) return;
  googleStatusList.innerHTML =
    '<div class="google-status-empty google-status-empty--chip">' +
    escapeGoogleHtml(message) +
    "</div>";
  updateGoogleStatusNav();
}

async function prepareIncident(item) {
  const active = isActiveIncident(item);
  const titleEn = item.external_desc || "به‌روزرسانی گوگل";
  const titleFa = await translateGoogleText(titleEn);
  const product =
    (item.affected_products && item.affected_products[0] && item.affected_products[0].title) ||
    item.service_name ||
    "";
  const impact = item.status_impact || (item.most_recent_update && item.most_recent_update.status) || "";
  const href = safeGoogleHref(item.uri ? GOOGLE_STATUS_BASE + item.uri : GOOGLE_STATUS_BASE);
  const latestEn = (item.most_recent_update && item.most_recent_update.text) || "";
  const latestFa = await translateLinkedText(latestEn);

  const updates = Array.isArray(item.updates) ? item.updates.slice() : [];
  updates.sort((a, b) => new Date(b.when || b.created || 0) - new Date(a.when || a.created || 0));
  const updatesFa = [];
  for (const update of updates) {
    updatesFa.push({
      when: update.when || update.created || "",
      status: update.status || "",
      textHtml: await translateLinkedText(update.text || ""),
    });
  }

  return {
    id: item.id,
    active: active,
    titleFa: titleFa,
    product: product,
    impact: impact,
    href: href,
    begin: item.begin || "",
    end: item.end || "",
    latestFa: latestFa,
    updatesFa: updatesFa,
  };
}

function chipHtml(item, index) {
  const stateClass = item.active ? "is-active" : "is-done";
  const stateText = item.active ? "فعال" : "پایان‌یافته";
  const dateLabel = formatGoogleDate(item.begin);
  return (
    '<button type="button" class="google-status-chip ' +
    stateClass +
    '" data-gs-index="' +
    index +
    '" title="' +
    escapeGoogleHtml(item.titleFa) +
    '">' +
    '<span class="google-status-chip__dot" aria-hidden="true"></span>' +
    '<span class="google-status-chip__body">' +
    '<span class="google-status-chip__title">' +
    escapeGoogleHtml(item.titleFa) +
    "</span>" +
    '<span class="google-status-chip__meta">' +
    '<span class="google-status-chip__state">' +
    stateText +
    "</span>" +
    (dateLabel ? "<span>" + escapeGoogleHtml(dateLabel) + "</span>" : "") +
    "</span>" +
    "</span>" +
    "</button>"
  );
}

function renderGoogleStatusItems(prepared) {
  if (!googleStatusList) return;
  googleStatusPrepared = prepared;
  if (!prepared.length) {
    renderGoogleStatusEmpty("به‌روزرسانی ثبت نشده");
    return;
  }
  googleStatusList.innerHTML = prepared.map((item, index) => chipHtml(item, index)).join("");
  googleStatusList.scrollLeft = 0;
  requestAnimationFrame(updateGoogleStatusNav);
}

function openGoogleStatusModal(index) {
  const item = googleStatusPrepared[index];
  if (!item || !googleStatusOverlay || !googleStatusModalBody) return;

  const stateText = item.active ? "فعال" : "پایان‌یافته";
  const updatesHtml = item.updatesFa.length
    ? item.updatesFa
        .map((update) => {
          return (
            '<li class="google-status-update">' +
            '<div class="google-status-update__head">' +
            '<time datetime="' +
            escapeGoogleHtml(update.when) +
            '">' +
            escapeGoogleHtml(formatGoogleDateTime(update.when)) +
            "</time>" +
            '<span class="google-status-pill">' +
            escapeGoogleHtml(statusLabel(update.status)) +
            "</span>" +
            "</div>" +
            '<p class="google-status-update__text">' +
            (update.textHtml || "—") +
            "</p>" +
            "</li>"
          );
        })
        .join("")
    : '<li class="google-status-update"><p class="google-status-update__text">جزئیات بیشتری ثبت نشده است.</p></li>';

  googleStatusModalBody.innerHTML =
    '<div class="google-status-detail">' +
    '<div class="google-status-detail__title-row">' +
    "<h3>" +
    escapeGoogleHtml(item.titleFa) +
    "</h3>" +
    '<span class="google-status-pill google-status-pill--state ' +
    (item.active ? "is-active" : "is-done") +
    '">' +
    stateText +
    "</span>" +
    "</div>" +
    '<div class="google-status-detail__meta">' +
    '<span class="google-status-pill">' +
    escapeGoogleHtml(statusLabel(item.impact)) +
    "</span>" +
    '<span class="google-status-pill">' +
    escapeGoogleHtml(productLabel(item.product)) +
    "</span>" +
    (item.begin
      ? "<span>شروع: " + escapeGoogleHtml(formatGoogleDateTime(item.begin)) + "</span>"
      : "") +
    (item.end
      ? "<span>پایان: " + escapeGoogleHtml(formatGoogleDateTime(item.end)) + "</span>"
      : '<span class="google-status-detail__live">هنوز در حال اجرا</span>') +
    "</div>" +
    (item.latestFa
      ? '<p class="google-status-detail__latest">' + item.latestFa + "</p>"
      : "") +
    '<div class="google-status-detail__section">' +
    "<h4>تاریخچه به‌روزرسانی‌ها</h4>" +
    '<ul class="google-status-updates">' +
    updatesHtml +
    "</ul>" +
    "</div>" +
    '<a class="google-status-detail__link" href="' +
    escapeGoogleHtml(item.href) +
    '" target="_blank" rel="noopener noreferrer">مشاهده در داشبورد گوگل</a>' +
    "</div>";

  googleStatusOverlay.classList.add("open");
  googleStatusOverlay.setAttribute("aria-hidden", "false");
}

function closeGoogleStatusModal() {
  if (!googleStatusOverlay) return;
  googleStatusOverlay.classList.remove("open");
  googleStatusOverlay.setAttribute("aria-hidden", "true");
}

async function renderPreparedFromRaw(items) {
  const prepared = [];
  for (const item of items) {
    prepared.push(await prepareIncident(item));
  }
  renderGoogleStatusItems(prepared);
}

async function fetchGoogleStatus(force) {
  if (typeof showGoogleStatus !== "undefined" && !showGoogleStatus) return;
  if (!force && googleStatusCache.items && Date.now() - googleStatusCache.at < GOOGLE_STATUS_TTL_MS) {
    await renderPreparedFromRaw(googleStatusCache.items);
    return;
  }

  renderGoogleStatusSkeleton();
  try {
    const res = await fetch(GOOGLE_STATUS_API, { cache: "no-store" });
    if (!res.ok) throw new Error("failed");
    const data = await res.json();
    const items = pickIncidents(data);
    googleStatusCache = { at: Date.now(), items: items };
    await renderPreparedFromRaw(items);
  } catch (err) {
    if (googleStatusCache.items) {
      await renderPreparedFromRaw(googleStatusCache.items);
      return;
    }
    renderGoogleStatusEmpty("دریافت ممکن نشد");
  }
}


function updateGoogleStatusNav() {
  if (!googleStatusList) return;
  const el = googleStatusList;
  const max = el.scrollWidth - el.clientWidth;
  const epsilon = 4;
  if (max <= epsilon) {
    if (googleStatusNavLeft) googleStatusNavLeft.disabled = true;
    if (googleStatusNavRight) googleStatusNavRight.disabled = true;
    return;
  }
  const sl = el.scrollLeft;
  let atStart;
  let atEnd;
  if (sl <= 0) {
    atStart = sl > -epsilon;
    atEnd = sl <= -max + epsilon;
  } else {
    atStart = sl <= epsilon;
    atEnd = sl >= max - epsilon;
  }
  if (googleStatusNavRight) googleStatusNavRight.disabled = atStart;
  if (googleStatusNavLeft) googleStatusNavLeft.disabled = atEnd;
}

function scrollGoogleStatus(direction) {
  if (!googleStatusList) return;
  const el = googleStatusList;
  const step = Math.max(200, Math.floor(el.clientWidth * 0.8));
  const sl = el.scrollLeft;
  let delta;
  if (sl <= 0) {
    delta = direction === "left" ? -step : step;
  } else {
    delta = direction === "left" ? step : -step;
  }
  el.scrollBy({ left: delta, behavior: "smooth" });
}

function applyGoogleStatusVisibility() {
  if (!googleStatusSection) return;
  const visible = typeof showGoogleStatus === "undefined" ? true : !!showGoogleStatus;
  googleStatusSection.style.display = visible ? "" : "none";
  if (!visible) closeGoogleStatusModal();
  if (visible) fetchGoogleStatus(false);
}



if (googleStatusNavLeft) {
  googleStatusNavLeft.addEventListener("click", () => scrollGoogleStatus("left"));
}
if (googleStatusNavRight) {
  googleStatusNavRight.addEventListener("click", () => scrollGoogleStatus("right"));
}
if (googleStatusList) {
  googleStatusList.addEventListener("scroll", updateGoogleStatusNav, { passive: true });
  window.addEventListener("resize", updateGoogleStatusNav);
}

if (googleStatusList) {
  googleStatusList.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault();
    googleStatusList.scrollLeft += e.deltaY;
  }, { passive: false });
}


if (googleStatusList) {
  let dragState = null;

  googleStatusList.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    dragState = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: googleStatusList.scrollLeft,
      moved: false,
    };
  });

  googleStatusList.addEventListener("pointermove", (e) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return;
    const dx = e.clientX - dragState.startX;
    if (!dragState.moved && Math.abs(dx) < 6) return;
    if (!dragState.moved) {
      dragState.moved = true;
      googleStatusList.classList.add("is-dragging");
      try {
        googleStatusList.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
    googleStatusList.scrollLeft = dragState.startScroll - dx;
  });

  function endDrag(e) {
    if (!dragState || (e && dragState.pointerId !== e.pointerId)) return;
    const moved = dragState.moved;
    dragState = null;
    googleStatusList.classList.remove("is-dragging");
    if (moved) {
      googleStatusList.dataset.gsSuppressClick = "1";
      setTimeout(() => {
        delete googleStatusList.dataset.gsSuppressClick;
      }, 0);
    }
  }

  googleStatusList.addEventListener("pointerup", endDrag);
  googleStatusList.addEventListener("pointercancel", endDrag);
  googleStatusList.addEventListener("lostpointercapture", endDrag);
}

if (googleStatusList) {
  googleStatusList.addEventListener("click", (e) => {
    if (googleStatusList.dataset.gsSuppressClick === "1") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const chip = e.target.closest("[data-gs-index]");
    if (!chip) return;
    const index = Number(chip.getAttribute("data-gs-index"));
    if (!Number.isNaN(index)) openGoogleStatusModal(index);
  });
}

if (googleStatusModalClose) {
  googleStatusModalClose.addEventListener("click", closeGoogleStatusModal);
}

if (googleStatusOverlay) {
  googleStatusOverlay.addEventListener("click", (e) => {
    if (e.target === googleStatusOverlay) closeGoogleStatusModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && googleStatusOverlay && googleStatusOverlay.classList.contains("open")) {
    closeGoogleStatusModal();
  }
});

window.refreshGoogleStatus = function () {
  return fetchGoogleStatus(true);
};
window.applyGoogleStatusVisibility = applyGoogleStatusVisibility;
window.closeGoogleStatusModal = closeGoogleStatusModal;