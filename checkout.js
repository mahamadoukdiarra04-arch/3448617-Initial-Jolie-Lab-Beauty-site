let products = window.JOLIE_PRODUCTS || [];

const PAYMENT_LABEL = "Paiement à la livraison";
const DELIVERY_LABEL = "À déterminer";
const ORDER_API_URL = "api/orders/create.php";
const LOCAL_ORDER_KEY = "jolieLabPreparedOrder";
const LOCAL_ORDERS_KEY = "jolieLabPreparedOrders";

const cartItemsNode = document.querySelector("[data-checkout-items]");
const countNode = document.querySelector("[data-checkout-count]");
const summaryCount = document.querySelector("[data-summary-count]");
const summaryTotal = document.querySelector("[data-summary-total]");
const form = document.querySelector("[data-checkout-form]");
const sendButton = document.querySelector("[data-send-order]");
const messageNode = document.querySelector("[data-checkout-message]");
const whatsAppFallback = document.querySelector("[data-whatsapp-fallback]");

function formatPrice(price) {
  return new Intl.NumberFormat("fr-FR").format(Number(price) || 0) + " FCFA";
}

function productImage(file) {
  if (!file) return "assets/brand/hero-01.jpeg";
  if (/^(https?:)?\/\//.test(file) || file.startsWith("data:")) return file;
  return file.startsWith("assets/") ? file : `assets/products/${file}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function lineName(product, variant) {
  return variant ? `${product.name} - ${variant.name}` : product.name;
}

function linePrice(product, variant) {
  return Number(variant ? variant.price : product.price) || 0;
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
      const product = products.find((item) => String(item.id) === String(parsed.id));
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

function trackInitiateCheckout() {
  const entries = cartEntries();
  if (!entries.length) return;

  const contents = entries.map(({ product, variant, quantity }) => {
    const price = linePrice(product, variant);
    const id = window.JoliePixel?.contentId(product, variant) || cartKey(product.id, variant?.id);
    return {
      id,
      quantity,
      item_price: price,
    };
  });
  const signature = entries
    .map(({ product, variant, quantity }) => `${window.JoliePixel?.contentId(product, variant) || cartKey(product.id, variant?.id)}:${quantity}`)
    .join("|");

  window.JoliePixel?.trackOnce(
    "InitiateCheckout",
    {
      content_ids: contents.map((item) => item.id),
      content_type: "product",
      contents,
      currency: "XOF",
      num_items: entries.reduce((sum, item) => sum + item.quantity, 0),
      value: cartAmount(),
    },
    signature,
    "session",
  );
}

function renderCheckout() {
  const entries = cartEntries();
  const total = cartAmount();
  const count = cartQuantity();

  countNode.textContent = count;
  summaryCount.textContent = count;
  summaryTotal.textContent = formatPrice(total);
  sendButton.disabled = entries.length === 0;
  updateWhatsAppFallback();

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
          <img src="${escapeHtml(productImage(product.images?.[0]))}" alt="${escapeHtml(lineName(product, variant))}" />
          <div>
            <span>${escapeHtml(product.category)}</span>
            <h3>${escapeHtml(lineName(product, variant))}</h3>
            <p>${formatPrice(linePrice(product, variant))}</p>
            <div class="qty-row">
              <button type="button" data-checkout-decrease="${escapeHtml(key)}" aria-label="Retirer une unité">-</button>
              <strong>${quantity}</strong>
              <button type="button" data-checkout-increase="${escapeHtml(key)}" aria-label="Ajouter une unité">+</button>
              <button type="button" data-checkout-remove="${escapeHtml(key)}">Retirer</button>
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
  messageNode.dataset.state = "";
  if (!cartEntries().length) {
    messageNode.textContent = "Ajoutez au moins un produit avant de passer commande.";
    return false;
  }
  if (!form.reportValidity()) {
    messageNode.textContent = "Complétez les champs obligatoires avant de passer commande.";
    return false;
  }
  return true;
}

function formDataObject() {
  return Object.fromEntries(new FormData(form).entries());
}

function orderItems() {
  return cartEntries().map(({ product, variant, quantity }) => {
    const unitPrice = linePrice(product, variant);
    return {
      productId: product.id,
      productSlug: product.slug || "",
      productName: product.name,
      variantId: variant?.id || "",
      variantName: variant?.name || "",
      displayName: lineName(product, variant),
      category: product.category,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
    };
  });
}

function createOrderNumber() {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const time = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  return `JLB-${date}-${time}`;
}

function buildOrderPayload() {
  const data = formDataObject();
  const items = orderItems();
  return {
    orderNumber: createOrderNumber(),
    createdAt: new Date().toISOString(),
    status: "new",
    customer: {
      name: data.customerName || "",
      phone: data.customerPhone || "",
      city: data.customerCity || "",
      area: data.customerArea || "",
      address: data.address || "",
      notes: data.notes || "",
    },
    paymentMethod: PAYMENT_LABEL,
    deliveryFee: null,
    deliveryLabel: DELIVERY_LABEL,
    productsTotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
    finalTotal: null,
    items,
  };
}

function storePreparedOrder(order) {
  localStorage.setItem(LOCAL_ORDER_KEY, JSON.stringify(order));
  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY)) || [];
  } catch {
    orders = [];
  }
  orders.unshift(order);
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders.slice(0, 10)));
}

function mergeServerOrder(localOrder, serverOrder) {
  return {
    ...localOrder,
    ...serverOrder,
    orderNumber: serverOrder.orderNumber || localOrder.orderNumber,
    serverSynced: true,
    localPreparedAt: localOrder.createdAt,
    items: localOrder.items,
    customer: localOrder.customer,
  };
}

async function parseJsonResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    const error = new Error("Réponse serveur invalide.");
    error.code = "invalid_response";
    throw error;
  }
}

async function createOrderOnServer(order) {
  const response = await fetch(ORDER_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(order),
  });
  const payload = await parseJsonResponse(response);

  if (!response.ok || !payload.ok) {
    const error = new Error(payload.message || "La commande ne peut pas être enregistrée pour le moment.");
    error.code = payload.code || "server_error";
    error.errors = payload.errors || {};
    throw error;
  }

  return mergeServerOrder(order, payload.order || {});
}

function formatServerErrors(error) {
  const errors = Object.values(error.errors || {}).filter(Boolean);
  if (!errors.length) return error.message;
  return errors.slice(0, 3).join(" ");
}

function canUseLocalFallback(error) {
  return !error.code || ["setup_missing", "invalid_response", "server_error"].includes(error.code);
}

function goToThankYouPage(order) {
  const orderNumber = encodeURIComponent(order.orderNumber || "");
  const target = orderNumber ? `merci.html?commande=${orderNumber}` : "merci.html";
  window.location.href = target;
}

function buildWhatsAppUrl(order = buildOrderPayload()) {
  const lines = [
    "Bonjour Jolie Lab Beauty, j'ai préparé cette commande sur le site :",
    "",
    "Produits :",
    ...order.items.map((item) => `- ${item.quantity} x ${item.displayName} (${formatPrice(item.unitPrice)})`),
    "",
    `Total produits : ${formatPrice(order.productsTotal)}`,
    `Livraison : ${order.deliveryLabel}`,
    `Paiement : ${order.paymentMethod}`,
    "",
    "Informations client :",
    `Nom : ${order.customer.name}`,
    `Téléphone : ${order.customer.phone}`,
    `Ville : ${order.customer.city}`,
    `Quartier / zone : ${order.customer.area}`,
    `Adresse : ${order.customer.address}`,
    `Note : ${order.customer.notes}`,
  ];
  return `https://wa.me/22394307799?text=${encodeURIComponent(lines.join("\n"))}`;
}

function updateWhatsAppFallback() {
  if (!whatsAppFallback) return;
  try {
    whatsAppFallback.href = buildWhatsAppUrl();
  } catch {
    whatsAppFallback.href = "https://wa.me/22394307799";
  }
}

function setSubmitting(isSubmitting) {
  sendButton.disabled = isSubmitting || cartEntries().length === 0;
  sendButton.classList.toggle("is-loading", isSubmitting);
  sendButton.textContent = isSubmitting ? "Préparation..." : "Passer commande";
}

async function submitOrder() {
  if (!validateForm()) return;

  setSubmitting(true);
  messageNode.textContent = "Enregistrement de votre commande...";

  const localOrder = buildOrderPayload();
  try {
    const savedOrder = await createOrderOnServer(localOrder);
    storePreparedOrder(savedOrder);
    updateWhatsAppFallback();
    messageNode.dataset.state = "success";
    messageNode.textContent =
      `Commande ${savedOrder.orderNumber} enregistrée. ` +
      "Redirection vers votre confirmation...";
    goToThankYouPage(savedOrder);
  } catch (error) {
    if (!canUseLocalFallback(error)) {
      messageNode.dataset.state = "";
      messageNode.textContent = formatServerErrors(error);
      setSubmitting(false);
      return;
    }

    const fallbackOrder = {
      ...localOrder,
      serverSynced: false,
      serverMessage: error.message,
    };
    storePreparedOrder(fallbackOrder);
    updateWhatsAppFallback();
    messageNode.dataset.state = "success";
    messageNode.textContent =
      `Commande ${fallbackOrder.orderNumber} préparée sur le site. ` +
      "Redirection vers votre confirmation...";
    goToThankYouPage(fallbackOrder);
  } finally {
    setSubmitting(false);
  }
}

document.addEventListener("click", (event) => {
  const increase = event.target.closest("[data-checkout-increase]");
  const decrease = event.target.closest("[data-checkout-decrease]");
  const remove = event.target.closest("[data-checkout-remove]");
  if (increase) changeQuantity(increase.dataset.checkoutIncrease, 1);
  if (decrease) changeQuantity(decrease.dataset.checkoutDecrease, -1);
  if (remove) changeQuantity(remove.dataset.checkoutRemove, -999);
});

form.addEventListener("input", () => {
  saveCheckoutInfo();
  updateWhatsAppFallback();
});
sendButton.addEventListener("click", submitOrder);

const saved = loadCheckoutInfo();
Object.entries(saved).forEach(([name, value]) => {
  const field = form.elements[name];
  if (field) field.value = value;
});

async function initializeCheckout() {
  products = await (window.JolieCatalog?.loadProducts(products) || Promise.resolve(products));
  renderCheckout();
  trackInitiateCheckout();
}

initializeCheckout();
