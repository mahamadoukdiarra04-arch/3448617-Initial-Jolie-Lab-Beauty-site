const CONTACT = {
  phone: "22394307799",
};

let products = window.JOLIE_PRODUCTS || [];
let currentProduct = null;
const detailRoot = document.querySelector("[data-product-detail]");
const cartCountNode = document.querySelector("[data-cart-count]");

function formatPrice(price) {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function productImage(file) {
  if (!file) return "assets/brand/hero-01.jpeg";
  if (/^(https?:)?\/\//.test(file) || file.startsWith("data:")) return file;
  if (file.startsWith("assets/")) return file;
  return `assets/products/${file}`;
}

function defaultVariant(product) {
  return Array.isArray(product.variants) && product.variants.length ? product.variants[0] : null;
}

function productVariant(product, variantId) {
  if (!Array.isArray(product.variants)) return null;
  return product.variants.find((variant) => variant.id === variantId) || null;
}

function cartKey(productId, variantId = "") {
  return variantId ? `${productId}::${variantId}` : String(productId);
}

function parseCartKey(key) {
  const [id, variantId = ""] = String(key).split("::");
  return { id, variantId };
}

function normalizeCart(cart) {
  return Object.entries(cart || {}).reduce((next, [rawKey, rawQuantity]) => {
    const quantity = Number(rawQuantity) || 0;
    if (quantity <= 0) return next;
    const parsed = parseCartKey(rawKey);
    const product = products.find((item) => String(item.id) === String(parsed.id));
    if (!product) return next;
    const variant = parsed.variantId ? productVariant(product, parsed.variantId) : defaultVariant(product);
    const key = cartKey(product.id, variant?.id);
    next[key] = (next[key] || 0) + quantity;
    return next;
  }, {});
}

function loadCart() {
  try {
    return normalizeCart(JSON.parse(localStorage.getItem("jolieLabCart")) || {});
  } catch {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem("jolieLabCart", JSON.stringify(cart));
}

function updateCartCount() {
  const count = Object.values(loadCart()).reduce((sum, quantity) => sum + quantity, 0);
  if (cartCountNode) cartCountNode.textContent = count;
}

function lineName(product, variant) {
  return variant ? `${product.name} - ${variant.name}` : product.name;
}

function productPriceLabel(product) {
  if (Array.isArray(product.variants) && product.variants.length) {
    return product.variants.map((variant) => `${variant.name} ${formatPrice(variant.price)}`).join(" • ");
  }
  return product.priceNote || formatPrice(product.price);
}

function productBenefits(product) {
  return String(product.description || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(titre|description|bienfaits|conseils d’utilisation|conseils d'utilisation)\s*:?\s*$/i.test(line))
    .filter((line) => !/\d[\d\s]*(?:fcfa|f)\b/i.test(line))
    .slice(0, 4);
}

function variantSelectMarkup(product) {
  if (!Array.isArray(product.variants) || !product.variants.length) return "";
  return `
    <label class="variant-field" for="product-variant">
      <span>Choisir le format</span>
      <select id="product-variant" data-variant-select required>
        <option value="">Sélectionner un format</option>
        ${product.variants
          .map((variant) => `<option value="${escapeHtml(variant.id)}">${escapeHtml(variant.name)} - ${formatPrice(variant.price)}</option>`)
          .join("")}
      </select>
    </label>
  `;
}

function findProduct() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const slug = params.get("slug");
  return products.find((product) => {
    return (id && String(product.id) === String(id)) || (slug && String(product.slug) === String(slug));
  });
}

function updateMeta(product) {
  const title = `${product.name} | Jolie Lab Beauty`;
  const description = product.summary || product.description || product.name;
  document.title = title;
  document.querySelector("[data-product-meta-description]")?.setAttribute("content", description);
  document.querySelector("[data-product-og-title]")?.setAttribute("content", title);
  document.querySelector("[data-product-og-description]")?.setAttribute("content", description);
  document.querySelector("[data-product-og-image]")?.setAttribute("content", productImage(product.images?.[0]));
}

function renderProduct(product) {
  const images = product.images?.length ? product.images : ["assets/brand/hero-01.jpeg"];
  const related = products.filter((item) => String(item.id) !== String(product.id) && item.category === product.category).slice(0, 3);
  const whatsappText = `Bonjour Jolie Lab Beauty, je souhaite commander : ${product.name} (${productPriceLabel(product)}).`;
  detailRoot.innerHTML = `
    <nav class="breadcrumb" aria-label="Fil d'Ariane">
      <a href="index.html#boutique">Boutique</a>
      <span>/</span>
      <span>${escapeHtml(product.category)}</span>
    </nav>

    <section class="product-detail-layout">
      <div class="product-detail-gallery">
        <img class="product-detail-main-image" src="${productImage(images[0])}" alt="${escapeHtml(product.name)}" data-gallery-main />
        <div class="product-detail-thumbs">
          ${images
            .map(
              (image, index) => `
                <button class="${index === 0 ? "is-active" : ""}" type="button" data-gallery-thumb="${productImage(image)}">
                  <img src="${productImage(image)}" alt="${escapeHtml(product.name)}" />
                </button>
              `,
            )
            .join("")}
        </div>
        <div class="product-detail-secondary">
          ${images
            .slice(1, 4)
            .map((image) => `<img src="${productImage(image)}" alt="${escapeHtml(product.name)}" />`)
            .join("")}
        </div>
      </div>

      <article class="product-detail-content">
        <p class="mini-label">${escapeHtml(product.category)}</p>
        <h1>${escapeHtml(product.name)}</h1>
        <div class="product-meta-row">
          <span>Réf. JLB-${escapeHtml(product.id)}</span>
          <span>Disponibilité à confirmer</span>
          <span>${escapeHtml(product.category)}</span>
        </div>
        <div class="product-price">${escapeHtml(productPriceLabel(product))}</div>
        ${variantSelectMarkup(product)}

        <div class="product-action-row">
          <button class="button button-primary" type="button" data-product-add>Ajouter au panier</button>
          <a class="button button-soft" href="https://wa.me/${CONTACT.phone}?text=${encodeURIComponent(whatsappText)}" target="_blank" rel="noreferrer">Commander sur WhatsApp</a>
        </div>
        <p class="product-feedback" data-product-feedback aria-live="polite"></p>

        <section class="product-description-block">
          <h2>Description originale</h2>
          <pre class="raw-description">${escapeHtml(product.description)}</pre>
        </section>

        <section class="product-info-panels">
          <article>
            <h2>Points clés</h2>
            <ul>${productBenefits(product).map((benefit) => `<li>${escapeHtml(benefit)}</li>`).join("")}</ul>
          </article>
          <article>
            <h2>Conseil d'utilisation</h2>
            <p>${escapeHtml(product.usage || "Demander confirmation sur WhatsApp pour la routine conseillée.")}</p>
          </article>
          <article>
            <h2>Livraison & paiement</h2>
            <p>Livraison à Bamako et à l'international. Paiement à la livraison, Orange Money, Moov Money ou Wave.</p>
          </article>
        </section>
      </article>
    </section>

    <section class="product-related-section">
      <div class="section-heading">
        <span class="mini-label">À découvrir</span>
        <div>
          <h2>Produits similaires</h2>
          <p>Complétez la routine avec une sélection proche du catalogue Jolie Lab Beauty.</p>
        </div>
      </div>
      <div class="product-related-grid">
        ${related
          .map(
            (item) => `
              <a class="related-card" href="produit.html?slug=${encodeURIComponent(item.slug)}&id=${encodeURIComponent(item.id)}">
                <img src="${productImage(item.images?.[0])}" alt="${escapeHtml(item.name)}" />
                <span>${escapeHtml(item.name)}</span>
              </a>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function selectedVariant() {
  if (!currentProduct) return null;
  const select = document.querySelector("[data-variant-select]");
  if (currentProduct.variants?.length && !select?.value) return null;
  return productVariant(currentProduct, select?.value || "") || defaultVariant(currentProduct);
}

function addCurrentProduct() {
  if (!currentProduct) return;
  const variant = selectedVariant();
  const feedback = document.querySelector("[data-product-feedback]");
  if (currentProduct.variants?.length && !variant) {
    const select = document.querySelector("[data-variant-select]");
    select?.reportValidity();
    select?.focus();
    if (feedback) feedback.textContent = "Choisissez le format avant d'ajouter ce produit.";
    return;
  }
  const cart = loadCart();
  const key = cartKey(currentProduct.id, variant?.id);
  cart[key] = (cart[key] || 0) + 1;
  saveCart(cart);
  updateCartCount();
  if (feedback) {
    feedback.innerHTML = `${escapeHtml(lineName(currentProduct, variant))} a été ajouté au panier. <a href="checkout.html">Finaliser la commande</a>`;
  }
}

document.addEventListener("click", (event) => {
  const thumb = event.target.closest("[data-gallery-thumb]");
  if (thumb) {
    const main = document.querySelector("[data-gallery-main]");
    if (main) main.src = thumb.dataset.galleryThumb;
    document.querySelectorAll("[data-gallery-thumb]").forEach((button) => {
      button.classList.toggle("is-active", button === thumb);
    });
  }
  if (event.target.closest("[data-product-add]")) addCurrentProduct();
});

async function initializeProductDetail() {
  products = await (window.JolieCatalog?.loadProducts(products) || Promise.resolve(products));
  currentProduct = findProduct();
  if (!currentProduct) {
    detailRoot.innerHTML = `
      <section class="checkout-card">
        <span class="mini-label">Produit indisponible</span>
        <h1>Ce produit n'est pas disponible.</h1>
        <p>Il a peut-être été retiré du catalogue Jolie Lab Beauty.</p>
        <a class="button button-primary" href="index.html#boutique">Retour à la boutique</a>
      </section>
    `;
    updateCartCount();
    return;
  }
  updateMeta(currentProduct);
  renderProduct(currentProduct);
  updateCartCount();
}

initializeProductDetail();
