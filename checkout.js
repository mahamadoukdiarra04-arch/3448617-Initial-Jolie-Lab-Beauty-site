const products = window.JOLIE_PRODUCTS || [];
const cartItemsNode = document.querySelector("[data-checkout-items]");
const countNode = document.querySelector("[data-checkout-count]");
const summaryCount = document.querySelector("[data-summary-count]");
const summaryTotal = document.querySelector("[data-summary-total]");
const form = document.querySelector("[data-checkout-form]");
const sendButton = document.querySelector("[data-send-order]");
const messageNode = document.querySelector("[data-checkout-message]");

function formatPrice(price) {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
}

function productImage(file) {
  return file.startsWith("assets/") ? file : `assets/products/${file}`;
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
  return { id: Number(id), variantId };
}

function normalizeCart(cart) {
  return Object.entries(cart || {}).reduce((next, [rawKey, rawQuantity]) => {
    const quantity = Number(rawQuantity) || 0;
    if (quantity <= 0) return next;
    const parsed = parseCartKey(rawKey);
    const product = products.find((item) => item.id === parsed.id);
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
  return variant ? variant.price : product.price;
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

function loadCheckoutInfo() {
  try {
    return JSON.parse(localStorage.getItem("jolieLabCheckout")) || {};
  } catch {
    return {};
  }
}

function saveCheckoutInfo() {
  const data = Object.fromEntries(new FormData(form).entries());
  localStorage.setItem("jolieLabCheckout", JSON.stringify(data));
}

function cartEntries() {
  const cart = loadCart();
  return Object.entries(cart)
    .map(([key, quantity]) => {
      const parsed = parseCartKey(key);
      const product = products.find((item) => item.id === parsed.id);
      if (!product) return null;
      const variant = parsed.variantId ? productVariant(product, parsed.variantId) : defaultVariant(product);
      return { key, product, variant, quantity };
    })
    .filter(Boolean);
}

function cartQuantity() {
  return cartEntries().reduce((sum, item) => sum + item.quantity, 0);
}

function cartAmount() {
  return cartEntries().reduce((sum, item) => sum + linePrice(item.product, item.variant) * item.quantity, 0);
}

function renderCheckout() {
  const entries = cartEntries();
  const total = cartAmount();
  const count = cartQuantity();

  countNode.textContent = count;
  summaryCount.textContent = count;
  summaryTotal.textContent = formatPrice(total);
  sendButton.disabled = entries.length === 0;

  if (!entries.length) {
    cartItemsNode.innerHTML = `
      <div class="checkout-empty">
        <h3>Votre panier est vide.</h3>
        <p>Ajoutez vos produits préférés avant de finaliser la commande.</p>
        <a class="button button-primary" href="index.html#boutique">Voir la boutique</a>
      </div>
    `;
    return;
  }

  cartItemsNode.innerHTML = entries
    .map(
      ({ key, product, variant, quantity }) => `
        <article class="checkout-item">
          <img src="${productImage(product.images[0])}" alt="${lineName(product, variant)}" />
          <div>
            <span>${product.category}</span>
            <h3>${lineName(product, variant)}</h3>
            <p>${formatPrice(linePrice(product, variant))}</p>
            <div class="qty-row">
              <button type="button" data-checkout-decrease="${key}" aria-label="Retirer une unité">-</button>
              <strong>${quantity}</strong>
              <button type="button" data-checkout-increase="${key}" aria-label="Ajouter une unité">+</button>
              <button type="button" data-checkout-remove="${key}">Retirer</button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function changeQuantity(key, delta) {
  const cart = loadCart();
  const next = (cart[key] || 0) + delta;
  if (next <= 0) {
    delete cart[key];
  } else {
    cart[key] = next;
  }
  saveCart(cart);
  renderCheckout();
}

function validateForm() {
  saveCheckoutInfo();
  if (!cartEntries().length) {
    messageNode.textContent = "Ajoutez au moins un produit avant d'envoyer la commande.";
    return false;
  }
  if (!form.reportValidity()) {
    messageNode.textContent = "Complétez les champs obligatoires avant l'envoi WhatsApp.";
    return false;
  }
  return true;
}

function buildWhatsAppUrl() {
  const data = Object.fromEntries(new FormData(form).entries());
  const entries = cartEntries();
  const lines = [
    "Bonjour Jolie Lab Beauty, je souhaite finaliser cette commande :",
    "",
    "Produits :",
    ...entries.map(({ product, variant, quantity }) => `- ${quantity} x ${lineName(product, variant)} (${formatPrice(linePrice(product, variant))})`),
    "",
    `Total produits : ${formatPrice(cartAmount())}`,
    "Livraison : frais à confirmer",
    "",
    "Informations client :",
    `Nom : ${data.customerName || ""}`,
    `Téléphone : ${data.customerPhone || ""}`,
    `Zone : ${data.deliveryZone || ""}`,
    `Paiement : ${data.paymentMethod || ""}`,
    `Adresse : ${data.address || ""}`,
    `Note : ${data.notes || ""}`,
  ];
  return `https://wa.me/22394307799?text=${encodeURIComponent(lines.join("\n"))}`;
}

document.addEventListener("click", (event) => {
  const increase = event.target.closest("[data-checkout-increase]");
  const decrease = event.target.closest("[data-checkout-decrease]");
  const remove = event.target.closest("[data-checkout-remove]");
  if (increase) changeQuantity(increase.dataset.checkoutIncrease, 1);
  if (decrease) changeQuantity(decrease.dataset.checkoutDecrease, -1);
  if (remove) changeQuantity(remove.dataset.checkoutRemove, -999);
});

form.addEventListener("input", saveCheckoutInfo);
sendButton.addEventListener("click", () => {
  if (!validateForm()) return;
  messageNode.textContent = "Commande prête. WhatsApp va s'ouvrir avec le message complet.";
  window.open(buildWhatsAppUrl(), "_blank", "noopener,noreferrer");
});

const saved = loadCheckoutInfo();
Object.entries(saved).forEach(([name, value]) => {
  const field = form.elements[name];
  if (field) field.value = value;
});

renderCheckout();
