// ------------------------------
// Load translations then boot
// ------------------------------
let translations = {};
let currentLang = "id";
let sliderTimer = null;
let currentSlide = 0;

fetch("translations.json")
  .then((r) => r.json())
  .then((json) => {
    translations = json;
    // default language from <html lang> if available
    const htmlLang = document.documentElement.lang;
    currentLang = htmlLang && translations[htmlLang] ? htmlLang : "id";
    setLanguage(currentLang);
    renderAll(currentLang);
    initNav();
    initForm();
    initMap();
  })
  .catch((err) => console.error("translations load error:", err));

// ------------------------------
// Language handling
// ------------------------------
const langSelect = document.getElementById("languageSwitcher");
if (langSelect) {
  langSelect.value = currentLang;
  langSelect.addEventListener("change", (e) => {
    currentLang = e.target.value;
    setLanguage(currentLang);
    renderAll(currentLang);
  });
}

function setLanguage(lang) {
  // textContent i18n
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const val = getDeep(translations[lang], key);
    if (typeof val === "string") el.textContent = val;
  });
  // placeholder i18n
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const val = getDeep(translations[lang], key);
    if (typeof val === "string") el.setAttribute("placeholder", val);
  });
  // update <html lang>
  document.documentElement.setAttribute("lang", lang);
}

function getDeep(obj, path) {
  return path
    .split(".")
    .reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
}

// ------------------------------
// Render sections
// ------------------------------
function renderAll(lang) {
  renderProducts(lang);
  renderWhy(lang);
  renderProcess(lang);
  renderTestimonials(lang);
}

function renderProducts(lang) {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  const items = getDeep(translations[lang], "products.list") || [];
  grid.innerHTML = items
    .map(
      (item) => `
    <article class="card">
      <img src="${item.image}" alt="${item.name}" class="card-media" />
      <div class="card-body">
        <h3 class="card-title">${item.name}</h3>
        <p class="card-text">${item.desc}</p>
      </div>
    </article>
  `
    )
    .join("");
}

function renderWhy(lang) {
  const grid = document.getElementById("whyGrid");
  if (!grid) return;
  const items = getDeep(translations[lang], "why.list") || [];
  grid.innerHTML = items
    .map(
      (item) => `
    <article class="card">
      <div class="card-body">
        <h3 class="card-title">${item.title}</h3>
        <p class="card-text">${item.desc}</p>
      </div>
    </article>
  `
    )
    .join("");
}

function renderProcess(lang) {
  const grid = document.getElementById("processGrid");
  if (!grid) return;
  const steps = getDeep(translations[lang], "process.steps") || [];
  grid.innerHTML = steps
    .map(
      (s, i) => `
    <article class="card">
      <div class="card-body">
        <h3 class="card-title">${i + 1}. ${s.title}</h3>
        <p class="card-text">${s.desc}</p>
      </div>
    </article>
  `
    )
    .join("");
}

// ------------------------------
// Testimonials slider (manual)
// ------------------------------
function renderTestimonials(lang) {
  const slidesEl = document.getElementById("slides");
  const dotsEl = document.getElementById("dots");
  if (!slidesEl || !dotsEl) return;

  const list = getDeep(translations[lang], "testimonials.list") || [];
  slidesEl.innerHTML = list
    .map(
      (t) => `
    <div class="slide">
      <div class="testimonial">
        <p>"${t.quote}"</p>
        <span>— ${t.name}, ${t.country}</span>
      </div>
    </div>
  `
    )
    .join("");

  dotsEl.innerHTML = list
    .map(
      (_, i) =>
        `<button class="dot" data-idx="${i}" aria-label="Go to slide ${
          i + 1
        }"></button>`
    )
    .join("");

  currentSlide = 0;
  updateSlider();

  // dots behavior
  dotsEl.querySelectorAll(".dot").forEach((dot) => {
    dot.addEventListener("click", (e) => {
      currentSlide = Number(e.currentTarget.getAttribute("data-idx"));
      updateSlider(true);
    });
  });

  // arrows
  const prev = document.getElementById("prev");
  const next = document.getElementById("next");
  prev.onclick = () => {
    currentSlide = (currentSlide - 1 + list.length) % list.length;
    updateSlider(true);
  };
  next.onclick = () => {
    currentSlide = (currentSlide + 1) % list.length;
    updateSlider(true);
  };

  // autoplay with pause on hover
  const slider = slidesEl.parentElement;
  clearInterval(sliderTimer);
  sliderTimer = setInterval(() => {
    currentSlide = (currentSlide + 1) % list.length;
    updateSlider();
  }, 4500);

  slider.addEventListener("mouseenter", () => clearInterval(sliderTimer));
  slider.addEventListener("mouseleave", () => {
    clearInterval(sliderTimer);
    sliderTimer = setInterval(() => {
      currentSlide = (currentSlide + 1) % list.length;
      updateSlider();
    }, 4500);
  });
}

function updateSlider(noEase) {
  const slidesEl = document.getElementById("slides");
  const dotsEl = document.getElementById("dots");
  if (!slidesEl || !dotsEl) return;

  if (noEase) {
    slidesEl.style.transition = "none";
    requestAnimationFrame(() => {
      slidesEl.style.transform = `translateX(-${currentSlide * 100}%)`;
      requestAnimationFrame(() => {
        slidesEl.style.transition = "";
      });
    });
  } else {
    slidesEl.style.transform = `translateX(-${currentSlide * 100}%)`;
  }

  dotsEl
    .querySelectorAll(".dot")
    .forEach((d, i) => d.classList.toggle("active", i === currentSlide));
}

// ------------------------------
// Nav behaviors (mobile + active link)
// ------------------------------
function initNav() {
  const menuToggle = document.getElementById("menuToggle");
  const navbar = document.getElementById("navbar");
  if (menuToggle && navbar) {
    menuToggle.addEventListener("click", () => navbar.classList.toggle("show"));
  }

  const navLinks = navbar.querySelectorAll("a");
  window.addEventListener("scroll", () => {
    let scrollPos = window.scrollY + 100;
    navLinks.forEach((link) => {
      const section = document.querySelector(link.getAttribute("href"));
      if (!section) return;
      if (
        section.offsetTop <= scrollPos &&
        section.offsetTop + section.offsetHeight > scrollPos
      ) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  });
}

// ------------------------------
// Contact form (demo)
// ------------------------------
function initForm() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.querySelector("#name").value.trim();
    const email = form.querySelector("#email").value.trim();
    const message = form.querySelector("#message").value.trim();

    if (!name || !email) {
      status.textContent =
        currentLang === "id"
          ? "Nama & email wajib diisi."
          : "Name & email are required.";
      return;
    }
    // Demo only
    status.textContent =
      currentLang === "id"
        ? "Terima kasih! Pesan Anda telah terkirim (demo)."
        : "Thanks! Your message has been sent (demo).";
    form.reset();
  });
}

// ------------------------------
// Leaflet map with red routes
// ------------------------------
// ================== INIT MAP ==================
function initMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  const map = L.map("map", { scrollWheelZoom: false }).setView(
    [-6.8897, 109.6753],
    4
  );

  // Ganti Tile Layer agar label negara lebih jelas
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }
  ).addTo(map);

  // HQ & destinations
  const HQ = { name: "Pekalongan, Indonesia", coords: [-6.8897, 109.6753] };
  const destinations = [
    { name: "Bangkok, Thailand", coords: [13.7563, 100.5018] },
    { name: "Berlin, Germany", coords: [52.52, 13.405] },
    { name: "Dubai, UAE", coords: [25.2048, 55.2708] },
    { name: "Mumbai, India", coords: [19.076, 72.8777] },
  ];

  // Marker HQ
  const hqMarker = L.marker(HQ.coords).addTo(map).bindPopup(HQ.name);
  hqMarker.on("mouseover", () => hqMarker.openPopup());
  hqMarker.on("mouseout", () => hqMarker.closePopup());

  // Marker Destinations + Polyline
  destinations.forEach((d) => {
    const marker = L.marker(d.coords).addTo(map).bindPopup(d.name);
    marker.on("mouseover", () => marker.openPopup());
    marker.on("mouseout", () => marker.closePopup());

    L.polyline([HQ.coords, d.coords], {
      color: "red",
      weight: 3,
      opacity: 0.75,
    }).addTo(map);
  });

  // Fit bounds to show all points
  const bounds = L.latLngBounds([
    HQ.coords,
    ...destinations.map((d) => d.coords),
  ]);
  map.fitBounds(bounds, { padding: [40, 40] });
}
