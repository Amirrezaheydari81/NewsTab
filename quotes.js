const QUOTE_API = "https://motivational-spark-api.vercel.app/api/quotes/random";
const TRANSLATE_API = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&dt=t&q=";

let quoteCache = {};
const quoteCard = document.getElementById("quoteCard");

async function translateText(text) {
  if (quoteCache[text]) return quoteCache[text];
  try {
    const res = await fetch(TRANSLATE_API + encodeURIComponent(text));
    const data = await res.json();
    const fa = data[0].map((chunk) => chunk[0]).join("");
    quoteCache[text] = fa;
    return fa;
  } catch {
    return null;
  }
}

async function fetchQuote() {
  if (typeof showQuotes !== "undefined" && !showQuotes) return;
  try {
    const res = await fetch(QUOTE_API);
    if (!res.ok) throw new Error("failed");
    const data = await res.json();
    const englishQuote = data.quote || "";

    quoteText.textContent = englishQuote;
    quoteCard.classList.remove("rtl");

    const fa = await translateText(englishQuote);
    if (fa) {
      quoteText.textContent = fa;
      quoteCard.classList.add("rtl");
    }
  } catch {
    quoteText.textContent = "امروز روز خوبی است.";
    quoteCard.classList.remove("rtl");
  }
}

if (typeof showQuotes === "undefined" || showQuotes) {
  fetchQuote();
}
