const $ = (selector) => document.querySelector(selector);

const state = {
  selectedId: 1,
  activeImage: 0,
  query: "",
  region: "Todas",
};

const normalize = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const displayName = (bixo) => bixo.displayName || bixo.name;
const pad = (id) => String(id).padStart(3, "0");
const hasArt = (bixo) => bixo.images && bixo.images.length > 0;
const noteKey = (id) => `tokantins-bixopedia-note-${id}`;

function getFilteredBixos() {
  const needle = normalize(state.query.trim());
  return window.BIXOS.filter((bixo) => {
    const regionMatch = state.region === "Todas" || bixo.region === state.region;
    const text = normalize(`${pad(bixo.id)} ${displayName(bixo)} ${bixo.region} ${bixo.subtitle || ""}`);
    return regionMatch && (!needle || text.includes(needle));
  });
}

function renderRegions() {
  const select = $("#regionFilter");
  const regions = ["Todas", ...new Set(window.BIXOS.map((bixo) => bixo.region))];
  select.innerHTML = regions.map((region) => `<option value="${region}">${region}</option>`).join("");
}

function renderStats() {
  const withArt = window.BIXOS.filter(hasArt).length;
  const withoutArt = window.BIXOS.length - withArt;
  const totalArt = window.BIXOS.reduce((sum, bixo) => sum + bixo.images.length, 0);

  $("#statsPanel").innerHTML = `
    <div class="stat-card">
      <span>Total</span>
      <strong>${window.BIXOS.length}</strong>
    </div>
    <div class="stat-card art-ready">
      <span>Com arte</span>
      <strong>${withArt}</strong>
    </div>
    <div class="stat-card art-missing">
      <span>Sem arte</span>
      <strong>${withoutArt}</strong>
    </div>
    <div class="stat-card">
      <span>Arquivos de arte</span>
      <strong>${totalArt}</strong>
    </div>
  `;
}

function renderList() {
  const filtered = getFilteredBixos();
  const list = $("#bixoList");
  $("#visibleCount").textContent = `${filtered.length} bixos`;
  $("#counter").textContent = pad(state.selectedId);

  list.innerHTML = filtered.map((bixo) => {
    const active = bixo.id === state.selectedId ? " active" : "";
    const art = hasArt(bixo)
      ? `<img src="${bixo.images[0].src}" alt="Arte de ${displayName(bixo)}" loading="lazy">`
      : `<div class="tiny-empty">?</div>`;
    return `
      <button class="bixo-row${active}" type="button" data-id="${bixo.id}">
        <div class="thumb">${art}</div>
        <div class="row-text">
          <strong>${pad(bixo.id)} - ${displayName(bixo)}</strong>
          <span>${bixo.region}</span>
        </div>
        ${bixo.images.length > 1 ? `<span class="art-count" title="Variações">${bixo.images.length}</span>` : ""}
      </button>
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
      <figcaption>${image.label}</figcaption>
    </figure>
    ${thumbs}
  `;
}

function renderDetail() {
  const bixo = window.BIXOS.find((item) => item.id === state.selectedId) || window.BIXOS[0];
  const note = localStorage.getItem(noteKey(bixo.id)) || "";

  $("#detailPanel").innerHTML = `
    <div class="detail-head">
      <div>
        <p class="number">#${pad(bixo.id)}</p>
        <h2>${displayName(bixo)}</h2>
        ${bixo.subtitle ? `<p class="subtitle">${bixo.subtitle}</p>` : ""}
      </div>
      <span class="badge">${bixo.region}</span>
    </div>

    ${renderArt(bixo)}

    <div class="fields">
      <div class="field">
        <span>Status</span>
        <strong>${hasArt(bixo) ? "Com arte" : "A preencher"}</strong>
      </div>
      <div class="field">
        <span>Variacoes</span>
        <strong>${hasArt(bixo) ? bixo.images.length : 0}</strong>
      </div>
      <div class="field">
        <span>Categoria</span>
        <strong>${bixo.region}</strong>
      </div>
    </div>

    <label class="notes">
      <span>Observacoes do artista</span>
      <textarea id="noteInput" rows="5" placeholder="Anote ideias, bioma, inspiracao, habilidades ou detalhes para completar depois.">${note}</textarea>
    </label>
  `;
}

function render() {
  renderList();
  renderDetail();
}

$("#searchInput").addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

$("#regionFilter").addEventListener("change", (event) => {
  state.region = event.target.value;
  render();
});

$("#bixoList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-id]");
  if (!button) return;
  state.selectedId = Number(button.dataset.id);
  state.activeImage = 0;
  render();
});

$("#detailPanel").addEventListener("click", (event) => {
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

renderRegions();
renderStats();
render();
