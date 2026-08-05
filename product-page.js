const productId = Number(document.body.dataset.productId);
const currentProduct = (window.JOLIE_PRODUCTS || []).find((product) => product.id === productId);
const cartCountNode = document.querySelector("[data-cart-count]");
const addButton = document.querySelector("[data-product-add]");
const feedback = document.querySelector("[data-product-feedback]");
const galleryMain = document.querySelector("[data-gallery-main]");

function defaultVariant(product) {
  return Array.isArray(product.variants) && product.variants.length ? product.variants[0] : null;
}

function productVariant(product, variantId) {
  if (!Array.isArray(product.variants)) return null;
  return product.variants.find((variant) => variant.id === variantId) || null;
}

function cartKey(productIdValue, variantId = "") {
  return variantId ? `${productIdValue}::${variantId}` : String(productIdValue);
}

function parseCartKey(key) {
  const [id, variantId = ""] = String(key).split("::");
  return { id: Number(id), variantId };
}

function normalizeCart(cart) {
  return Object.entries(cart || {}).reduce((next, [rawKey, rawQuantity]) => {
    const quantity = Number(rawQuantity) || 0;
    if (quantity <= 0) return next;
    const parsed = parseCartKey(rawKey);
    const product = (window.JOLIE_PRODUCTS || []).find((item) => item.id === parsed.id);
    if (!product) return next;
    const variant = parsed.variantId ? productVariant(product, parsed.variantId) : defaultVariant(product);
    const key = cartKey(product.id, variant?.id);
    next[key] = (next[key] || 0) + quantity;
    return next;
  }, {});
}

function lineName(product, variant) {
  return variant ? `${product.name} - ${variant.name}` : product.name;
}

function linePrice(product, variant) {
  return Number(variant ? variant.price : product.price) || 0;
}

function trackPixelAddToCart(product, variant) {
  const price = linePrice(product, variant);
  const contentId = window.JoliePixel?.contentId(product, variant) || String(product.id);
  if (window.JoliePixel) {
    window.JoliePixel.track("AddToCart", {
      content_ids: [contentId],
      content_name: lineName(product, variant),
      content_type: "product",
      contents: [{ id: contentId, quantity: 1, item_price: price }],
      currency: "XOF",
      value: price,
    });
  } else if (typeof window.fbq === "function") {
    window.fbq("track", "AddToCart", {
      content_ids: [contentId],
      content_name: lineName(product, variant),
      content_type: "product",
      currency: "XOF",
      value: price,
    });
  }
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
  const cart = loadCart();
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  if (cartCountNode) cartCountNode.textContent = count;
}

function selectedVariant() {
  if (!currentProduct) return null;
  const select = document.querySelector(`[data-variant-select="${currentProduct.id}"]`);
  if (currentProduct.variants?.length && !select?.value) return null;
  return productVariant(currentProduct, select?.value || "") || defaultVariant(currentProduct);
}

function addCurrentProduct() {
  if (!currentProduct) return;
  const variant = selectedVariant();
  if (currentProduct.variants?.length && !variant) {
    const select = document.querySelector(`[data-variant-select="${currentProduct.id}"]`);
    select?.reportValidity();
    select?.focus();
    if (feedback) feedback.textContent = "Choisissez Petit complet ou Grand complet avant d'ajouter ce produit.";
    return;
  }
  const key = cartKey(currentProduct.id, variant?.id);
  const cart = loadCart();
  cart[key] = (cart[key] || 0) + 1;
  saveCart(cart);
  updateCartCount();
  trackPixelAddToCart(currentProduct, variant);
  if (feedback) {
    feedback.innerHTML = `${lineName(currentProduct, variant)} a été ajouté au panier. <a href="../checkout.html">Finaliser la commande</a>`;
  }
}

document.addEventListener("click", (event) => {
  const thumb = event.target.closest("[data-gallery-thumb]");
  if (thumb && galleryMain) {
    galleryMain.src = thumb.dataset.galleryThumb;
    document.querySelectorAll("[data-gallery-thumb]").forEach((button) => {
      button.classList.toggle("is-active", button === thumb);
    });
  }
});

if (addButton) addButton.addEventListener("click", addCurrentProduct);
const firstThumb = document.querySelector("[data-gallery-thumb]");
if (firstThumb) firstThumb.classList.add("is-active");
updateCartCount();
