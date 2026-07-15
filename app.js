const $ = (selector) => document.querySelector(selector);

const state = {
  selectedId: 1,
  activeImage: 0,
  query: "",
  region: "Todas",
  type: "Todos",
  category: "Todos",
  favoritesOpen: false,
  favorites: [],
  sketchesOpen: false,
  detailOpen: false,
  drawerOpen: false,
};

const normalize = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const displayName = (bixo) => {
  const name = bixo.displayName || bixo.name;
  return categoryName(bixo) === "Espera" && !normalize(name).includes("(espera)")
    ? `${name} (espera)`
    : name;
};
const pad = (id) => String(id).padStart(3, "0");
const hasArt = (bixo) => bixo.images && bixo.images.length > 0;
const noteKey = (id) => `tokantins-bixopedia-note-${id}`;
const favoriteKey = "tokantins-bixopedia-favorites";
const sketches = () => window.SKETCHES || [];
const allTypes = () => window.BIXO_TYPES || [];
const regionThemes = {
  Iniciais: ["#7fdc75", "#edfbe9"],
  "Primeiro Mato": ["#8bd96d", "#eef9e8"],
  Cavernas: ["#a9825a", "#f6efe7"],
  "Matos Intermediários": ["#68c35d", "#edf9ea"],
  "Águas": ["#5fd0df", "#e9f9fb"],
  Aldeias: ["#c991dd", "#f8eefb"],
  Fazenda: ["#e6bf66", "#fbf5e6"],
  Praia: ["#67d7c8", "#e9fbf8"],
  Capital: ["#7da4df", "#edf4ff"],
  Distrito: ["#b890ee", "#f4edff"],
  Safari: ["#f1c560", "#fff6dd"],
  Cidadezinha: ["#d7bd7b", "#faf3df"],
  "Cidade Fantasma": ["#8877c9", "#f1effb"],
  Serra: ["#b48772", "#f6eee9"],
  Lendas: ["#d56079", "#fff0f3"],
  "Feito por Humanos": ["#f08d47", "#fff1e7"],
  "Pré-Históricos": ["#8fafa1", "#eef5f3"],
  "Lendários": ["#f0a83f", "#fff3dc"],
  Espera: ["#b5bdc8", "#f3f5f7"],
};

const regionOrder = [
  "Iniciais",
  "Primeiro Mato",
  "Cavernas",
  "Matos Intermediários",
  "Águas",
  "Aldeias",
  "Fazenda",
  "Praia",
  "Capital",
  "Distrito",
  "Safari",
  "Cidadezinha",
  "Cidade Fantasma",
  "Serra",
  "Feito por Humanos",
  "Lendas",
  "Pré-Históricos",
  "Lendários",
  "Espera",
];

const categoryTabs = [
  { id: "Todos", label: "Todos" },
  { id: "Comuns", label: "Comuns" },
  { id: "Lendas", label: "Lendas" },
  { id: "Pré-Históricos", label: "Pré-Históricos" },
  { id: "Lendários", label: "Lendários" },
  { id: "Espera", label: "Espera" },
];

function categoryName(bixo) {
  if (["Lendas", "Pré-Históricos", "Lendários", "Espera"].includes(bixo.region)) {
    return bixo.region;
  }

  if (bixo.rarity === "Lenda") return "Lendas";
  if (bixo.rarity === "Lendário") return "Lendários";
  return "";
}

function realRegion(bixo) {
  return categoryName(bixo) ? "" : bixo.region;
}

function metaLabel(bixo) {
  return categoryName(bixo) || bixo.region;
}

function metaTitle(bixo) {
  return categoryName(bixo) ? "Categoria" : "Região";
}

function filterCategory(bixo) {
  return categoryName(bixo) || "Comuns";
}

function getRegionTheme(region) {
  const theme = regionThemes[region] || ["#7da4df", "#edf4ff"];
  return { color: theme[0], soft: theme[1] };
}

const typeThemes = {
  Planta: ["#5ec85c", "#dff6d7"],
  Brasa: ["#e65a38", "#ffd5bf"],
  Água: ["#51c8df", "#d7f5fb"],
  Básico: ["#c9c4b8", "#f5f2ea"],
  Malicioso: ["#5d5475", "#e7e0f4"],
  Terra: ["#b07a44", "#f1dfc7"],
  Tóxico: ["#9b63cf", "#ecdfff"],
  Aéreo: ["#8ccbe8", "#e2f6ff"],
  Elétrico: ["#f2c94c", "#fff0a8"],
  Gélido: ["#88d7e8", "#e5fbff"],
  Artrópode: ["#9fbd42", "#edf6c8"],
  Metálico: ["#8fa3b4", "#e9eef2"],
  Pedra: ["#a78f72", "#eee3d5"],
  Místico: ["#ce83db", "#f7e4fb"],
  Psíquico: ["#e875b8", "#ffe1f1"],
  Fantasma: ["#7665c7", "#e9e5ff"],
  Feral: ["#b94b4b", "#f5d7d7"],
  Lutador: ["#d9863d", "#f6dfc9"],
};

function getCardTheme(bixo) {
  if (!hasArt(bixo)) {
    return sketchesForBixo(bixo).length > 0
      ? { color: "#d3b37a", soft: "#f7ecd2" }
      : { color: "#f5f5f5", soft: "#ffffff" };
  }

  const theme = typeThemes[bixo.types?.[0]] || ["#7da4df", "#edf4ff"];
  return { color: theme[0], soft: theme[1] };
}

function getStoredFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem(favoriteKey) || "[]");
    return Array.isArray(stored) ? stored.map(Number).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(favoriteKey, JSON.stringify(state.favorites));
}

function isFavorite(id) {
  return state.favorites.includes(id);
}

function toggleFavorite(id) {
  if (isFavorite(id)) {
    state.favorites = state.favorites.filter((item) => item !== id);
  } else {
    state.favorites = [...state.favorites, id];
  }
  saveFavorites();
}

function favoriteBixos() {
  return state.favorites
    .map((id) => window.BIXOS.find((bixo) => bixo.id === id))
    .filter(Boolean);
}

function sketchesForBixo(bixo) {
  const bixoName = normalize(displayName(bixo));
  return sketches().filter((sketch) =>
    sketch.bixoId === bixo.id || normalize(sketch.bixo || "") === bixoName
  );
}

function getBixoStatus(bixo) {
  if (hasArt(bixo)) {
    return { label: "Com arte final", className: "status-final" };
  }

  if (sketchesForBixo(bixo).length > 0) {
    return { label: "Com esboço", className: "status-sketch" };
  }

  return { label: "Sem arte", className: "status-missing" };
}

function regionRank(region) {
  const index = regionOrder.indexOf(region);
  return index === -1 ? regionOrder.length - 3 : index;
}

function sortBixos(bixos) {
  return [...bixos].sort((a, b) => {
    const rank = regionRank(metaLabel(a)) - regionRank(metaLabel(b));
    return rank || a.id - b.id;
  });
}

function getFilteredBixos() {
  const needle = normalize(state.query.trim());
  return sortBixos(window.BIXOS.filter((bixo) => {
    const regionMatch = state.region === "Todas" || realRegion(bixo) === state.region;
    const typeMatch = state.type === "Todos" || (bixo.types || []).includes(state.type);
    const categoryMatch = state.category === "Todos" || filterCategory(bixo) === state.category;
    const text = normalize(`${pad(bixo.id)} ${displayName(bixo)} ${metaLabel(bixo)} ${(bixo.types || []).join(" ")} ${bixo.subtitle || ""}`);
    return regionMatch && typeMatch && categoryMatch && (!needle || text.includes(needle));
  }));
}

function renderRegions() {
  const select = $("#regionFilter");
  const regions = ["Todas", ...[...new Set(window.BIXOS.map(realRegion).filter(Boolean))]
    .sort((a, b) => regionRank(a) - regionRank(b) || a.localeCompare(b, "pt-BR"))];
  select.innerHTML = regions.map((region) => `<option value="${region}">${region}</option>`).join("");
}

function renderTypes() {
  const select = $("#typeFilter");
  const types = ["Todos", ...allTypes().map((type) => type.name)];
  select.innerHTML = types.map((type) => `<option value="${type}">${type}</option>`).join("");
}

function renderCategoryTabs() {
  $("#categoryTabs").innerHTML = categoryTabs.map((item) => `
    <button class="category-tab${state.category === item.id ? " active" : ""}" type="button" data-category="${item.id}">
      ${item.label}
    </button>
  `).join("");
}

function typeEmoji(typeName) {
  return allTypes().find((type) => type.name === typeName)?.emoji || "";
}

function renderTypeChips(types = []) {
  return `
    <div class="type-chips">
      ${types.map((type) => `<span class="type-chip">${typeEmoji(type)} ${type}</span>`).join("")}
    </div>
  `;
}

function renderStats() {
  const withFinalArt = window.BIXOS.filter(hasArt).length;
  const withSketchOnly = window.BIXOS.filter((bixo) => !hasArt(bixo) && sketchesForBixo(bixo).length > 0).length;
  const withoutVisual = window.BIXOS.length - withFinalArt - withSketchOnly;
  const totalArt = window.BIXOS.reduce((sum, bixo) => sum + bixo.images.length, 0);
  const typeCounts = allTypes()
    .map((type) => ({
      ...type,
      count: window.BIXOS.filter((bixo) => (bixo.types || []).includes(type.name)).length,
    }))
    .filter((type) => type.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR"));

  $("#statsPanel").innerHTML = `
    <h2>Resumo</h2>
    <div class="stat-card">
      <span>Total</span>
      <strong>${window.BIXOS.length}</strong>
    </div>
    <div class="stat-card art-ready">
      <span>Arte final</span>
      <strong>${withFinalArt}</strong>
    </div>
    <div class="stat-card sketch-ready">
      <span>Com esboço</span>
      <strong>${withSketchOnly}</strong>
    </div>
    <div class="stat-card art-missing">
      <span>Sem arte</span>
      <strong>${withoutVisual}</strong>
    </div>
    <div class="stat-card">
      <span>Arquivos de arte</span>
      <strong>${totalArt}</strong>
    </div>
    <div class="type-counts">
      <h3>Tipos nos bixos</h3>
      ${typeCounts.map((type) => `
        <div class="type-count-row">
          <span>${type.emoji || ""} ${type.name}</span>
          <strong>${type.count}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function renderFavorites() {
  const favorites = favoriteBixos();
  const items = state.favoritesOpen
    ? favorites.map((bixo) => {
        const art = hasArt(bixo)
          ? `<img src="${bixo.images[0].src}" alt="Arte de ${displayName(bixo)}" loading="lazy">`
          : `<div class="favorite-empty-thumb">?</div>`;
        return `
          <button class="favorite-card" type="button" data-favorite-id="${bixo.id}">
            <div class="favorite-thumb">${art}</div>
            <div class="favorite-info">
              <strong>${displayName(bixo)}</strong>
              <span>#${pad(bixo.id)} · ${metaLabel(bixo)}</span>
            </div>
          </button>
        `;
      }).join("")
    : "";

  $("#favoritesPanel").innerHTML = `
    <button class="favorite-toggle" type="button" aria-expanded="${state.favoritesOpen}">
      <span>Favoritos</span>
      <strong>${favorites.length}</strong>
      <em>${state.favoritesOpen ? "Fechar" : "Abrir"}</em>
    </button>
    ${state.favoritesOpen ? `
      <div class="favorite-content">
        ${favorites.length ? items : `<p class="favorite-empty">Nenhum favorito ainda.</p>`}
      </div>
    ` : ""}
  `;
}

function renderSketches() {
  const total = sketches().length;
  const items = state.sketchesOpen
    ? sketches().map((sketch) => `
        <article class="sketch-card">
          <div class="sketch-thumb">
            <img src="${sketch.src}" alt="Esboço de ${sketch.name}" loading="lazy">
          </div>
          <div class="sketch-info">
            <strong>${sketch.name}</strong>
            <span>${sketch.date || "Sem data"}</span>
            ${sketch.bixo ? `<small>${sketch.bixo}</small>` : ""}
          </div>
        </article>
      `).join("")
    : "";

  $("#sketchesPanel").innerHTML = `
    <button class="sketch-toggle" type="button" aria-expanded="${state.sketchesOpen}">
      <span>Esboços</span>
      <strong>${total}</strong>
      <em>${state.sketchesOpen ? "Fechar" : "Abrir"}</em>
    </button>
    ${state.sketchesOpen ? `
      <div class="sketch-content">
        ${total ? items : `<p class="sketch-empty">Nenhum esboço adicionado ainda.</p>`}
      </div>
    ` : ""}
  `;
}

function renderList() {
  const filtered = getFilteredBixos();
  const list = $("#bixoList");
  $("#visibleCount").textContent = `${filtered.length} bixos`;

  list.innerHTML = filtered.map((bixo) => {
    const active = bixo.id === state.selectedId ? " active" : "";
    const favorite = isFavorite(bixo.id);
    const theme = getCardTheme(bixo);
    const art = hasArt(bixo)
      ? `<img src="${bixo.images[0].src}" alt="Arte de ${displayName(bixo)}" loading="lazy">`
      : `<div class="tiny-empty">?</div>`;
    return `
      <article class="bixo-row${active}" style="--row-color: ${theme.color}; --row-soft: ${theme.soft};">
        <div class="row-main" role="button" tabindex="0" data-id="${bixo.id}">
          <div class="row-text">
            <div class="row-title">
              <span class="row-number">#${pad(bixo.id)}</span>
              <strong>${displayName(bixo)}</strong>
              <button class="row-favorite${favorite ? " active" : ""}" type="button" data-list-favorite="${bixo.id}" aria-label="${favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}">
                ${favorite ? "&#9733;" : "&#9734;"}
              </button>
            </div>
            ${renderTypeChips(bixo.types)}
          </div>
          <div class="thumb">${art}</div>
        </div>
      </article>
    `;
  }).join("");

  if (!filtered.find((bixo) => bixo.id === state.selectedId) && filtered.length) {
    state.selectedId = filtered[0].id;
    state.activeImage = 0;
    render();
  }
}

function renderArt(bixo) {
  if (!hasArt(bixo)) {
    return $("#emptyArtTemplate").innerHTML;
  }

  const image = bixo.images[state.activeImage] || bixo.images[0];
  const thumbs = bixo.images.length > 1
    ? `<div class="variation-strip">${bixo.images.map((item, index) => `
        <button class="variation${index === state.activeImage ? " active" : ""}" type="button" data-image="${index}">
          <img src="${item.src}" alt="${item.label} de ${displayName(bixo)}">
          <span>${item.label}</span>
        </button>
      `).join("")}</div>`
    : "";

  return `
    <figure class="art-stage">
      <img src="${image.src}" alt="Arte de ${displayName(bixo)}">
    </figure>
    ${thumbs}
  `;
}

function renderDetail() {
  const bixo = window.BIXOS.find((item) => item.id === state.selectedId) || window.BIXOS[0];
  const note = localStorage.getItem(noteKey(bixo.id)) || "";
  const status = getBixoStatus(bixo);
  const theme = getRegionTheme(metaLabel(bixo));
  const favorite = isFavorite(bixo.id);
  const detailPanel = $("#detailPanel");
  detailPanel.style.setProperty("--row-color", theme.color);
  detailPanel.style.setProperty("--row-soft", theme.soft);
  detailPanel.classList.toggle("open", state.detailOpen);

  detailPanel.innerHTML = `
    <div class="detail-head">
      <button class="detail-close" type="button" data-detail-close aria-label="Fechar informações">×</button>
      <div>
        <p class="number">#${pad(bixo.id)}</p>
        <h2>${displayName(bixo)}</h2>
        ${renderTypeChips(bixo.types)}
        ${bixo.subtitle ? `<p class="subtitle">${bixo.subtitle}</p>` : ""}
      </div>
      <span class="badge">${metaLabel(bixo)}</span>
      <button class="favorite-star${favorite ? " active" : ""}" type="button" data-favorite-toggle="${bixo.id}" aria-label="${favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}" title="${favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}">
        ${favorite ? "&#9733;" : "&#9734;"}
      </button>
    </div>

    ${renderArt(bixo)}

    <div class="fields">
      <div class="field">
        <span>Status</span>
        <strong class="${status.className}">${status.label}</strong>
      </div>
      <div class="field">
        <span>${metaTitle(bixo)}</span>
        <strong>${metaLabel(bixo)}</strong>
      </div>
    </div>

    <label class="notes">
      <span>Observações do artista</span>
      <textarea id="noteInput" rows="5" placeholder="Anote ideias, bioma, inspiração, habilidades ou detalhes para completar depois.">${note}</textarea>
    </label>
  `;
}

function render() {
  renderList();
  renderDetail();
  renderCategoryTabs();
  renderFavorites();
  renderSketches();
}

$("#searchInput").addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

$("#regionFilter").addEventListener("change", (event) => {
  state.region = event.target.value;
  render();
});

$("#typeFilter").addEventListener("change", (event) => {
  state.type = event.target.value;
  render();
});

$("#categoryTabs").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  render();
});

function setDrawerOpen(open) {
  state.drawerOpen = open;
  $("#sideDrawer").classList.toggle("open", open);
  $("#sideDrawer").setAttribute("aria-hidden", String(!open));
  $("#menuButton").setAttribute("aria-expanded", String(open));
  $("#drawerBackdrop").hidden = !open;
}

$("#menuButton").addEventListener("click", () => {
  setDrawerOpen(!state.drawerOpen);
});

$("#drawerClose").addEventListener("click", () => {
  setDrawerOpen(false);
});

$("#drawerBackdrop").addEventListener("click", () => {
  setDrawerOpen(false);
});

$("#sketchesPanel").addEventListener("click", (event) => {
  if (!event.target.closest(".sketch-toggle")) return;
  state.sketchesOpen = !state.sketchesOpen;
  renderSketches();
});

$("#favoritesPanel").addEventListener("click", (event) => {
  if (event.target.closest(".favorite-toggle")) {
    state.favoritesOpen = !state.favoritesOpen;
    renderFavorites();
    return;
  }

  const favoriteButton = event.target.closest("[data-favorite-id]");
  if (!favoriteButton) return;
  state.selectedId = Number(favoriteButton.dataset.favoriteId);
  state.activeImage = 0;
  state.detailOpen = true;
  render();
  $("#detailPanel").scrollIntoView({ behavior: "smooth", block: "start" });
});

$("#bixoList").addEventListener("click", (event) => {
  const favoriteButton = event.target.closest("[data-list-favorite]");
  if (favoriteButton) {
    toggleFavorite(Number(favoriteButton.dataset.listFavorite));
    render();
    return;
  }

  const button = event.target.closest("[data-id]");
  if (!button) return;
  state.selectedId = Number(button.dataset.id);
  state.activeImage = 0;
  state.detailOpen = true;
  render();
});

$("#detailPanel").addEventListener("click", (event) => {
  if (event.target.closest("[data-detail-close]")) {
    state.detailOpen = false;
    renderDetail();
    return;
  }

  const favoriteButton = event.target.closest("[data-favorite-toggle]");
  if (favoriteButton) {
    toggleFavorite(Number(favoriteButton.dataset.favoriteToggle));
    render();
    return;
  }

  const button = event.target.closest("[data-image]");
  if (!button) return;
  state.activeImage = Number(button.dataset.image);
  renderDetail();
});

$("#detailPanel").addEventListener("input", (event) => {
  if (event.target.id !== "noteInput") return;
  localStorage.setItem(noteKey(state.selectedId), event.target.value);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

state.favorites = getStoredFavorites();
renderRegions();
renderTypes();
renderStats();
renderCategoryTabs();
renderFavorites();
renderSketches();
render();
