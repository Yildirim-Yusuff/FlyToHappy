/* ============================================================
   — script.js
   Mantık: önce öğeleri "yakala" (querySelector), sonra olay
   (event) dinleyicileri ekle: tıklanınca/değişince ne olsun?
   ============================================================ */

/* Kısa yol: her yerde document.querySelector yazmamak için */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ---------- 1) HERO SLIDER: kareleri sırayla göster ---------- */
const slides = $$(".slide");
const dots   = $$(".dot");
let current  = 0;                 // şu an görünen kare
let timer;                        // otomatik geçiş sayacı

function showSlide(i) {
  current = (i + slides.length) % slides.length; // sınırdan taşarsa başa dön
  slides.forEach((s, idx) => s.classList.toggle("active", idx === current));
  dots.forEach((d, idx) => d.classList.toggle("active", idx === current));

  // Aktif karenin şehir/ülke bilgisini caption'a yaz (başkent etiketi)
  const activeSlide = slides[current];
  if (activeSlide) {
    const city = $("#slideCity");
    const country = $("#slideCountry");
    if (city)    city.textContent    = activeSlide.dataset.city    || "";
    if (country) country.textContent = activeSlide.dataset.country || "";
  }
}
function startAuto() {
  clearInterval(timer);
  timer = setInterval(() => showSlide(current + 1), 22000); // her 22 sn
}
// Noktalara tıklayınca o kareye git
dots.forEach((dot) => {
  dot.addEventListener("click", () => { showSlide(+dot.dataset.i); startAuto(); });
});
if (slides.length) { showSlide(0); startAuto(); }

/* Search panel logic (dates, trip type, swap, passengers, search) now lives
   in the shared wwwroot/js/search-panel.js, used by Home + SearchResults. */

/* ---------- 7) Popüler rota kartına tıkla = o şehre ara ---------- */
$$(".route-card").forEach((card) => {
  card.addEventListener("click", () => {
    if (window.flySearchPanel) {
      window.flySearchPanel.runSearch(undefined, card.dataset.city);
    }
  });
});

/* ---------- 8) NAVBAR: scroll durumu ---------- */
/* Sayfa en üstteyken çok şeffaf; ~30px sonra glass etkisi güçlenir ("scrolled" class) */
const navEl = $(".nav-altura");
function updateNavScroll() {
  navEl.classList.toggle("scrolled", window.scrollY > 30);
}
window.addEventListener("scroll", updateNavScroll, { passive: true });
updateNavScroll(); // sayfa yenilendiğinde (scroll pozisyonu korunmuşsa) başlangıç durumunu ayarla

/* ---------- 9) NAVBAR: dropdown'lar + giriş modal'ı ---------- */
/* Artık wwwroot/js/navbar.js içinde (Home ve arama sayfaları ortak). */
