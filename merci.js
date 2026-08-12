const ORDER_KEY = "jolieLabPreparedOrder";
const ORDERS_KEY = "jolieLabPreparedOrders";
const TRACKED_KEY = "jolieLabTrackedOrders";

const params = new URLSearchParams(window.location.search);
const requestedOrderNumber = params.get("commande") || params.get("order") || "";

const numberNode = document.querySelector("[data-receipt-number]");
const dateNode = document.querySelector("[data-receipt-date]");
const itemsNode = document.querySelector("[data-receipt-items]");
const totalNode = document.querySelector("[data-receipt-products-total]");
const nameNode = document.querySelector("[data-receipt-name]");
const phoneNode = document.querySelector("[data-receipt-phone]");

function formatPrice(price) {
  return new Intl.NumberFormat("fr-FR").format(Number(price) || 0) + " FCFA";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function findOrder() {
  const current = loadJson(ORDER_KEY, null);
  const orders = loadJson(ORDERS_KEY, []);

  if (requestedOrderNumber) {
    return [current, ...orders].find((order) => order?.orderNumber === requestedOrderNumber) || null;
  }

  return current || orders[0] || null;
}

function formatDate(value) {
  if (!value) return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date());
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function renderOrder(order) {
  numberNode.textContent = order?.orderNumber || requestedOrderNumber || "JLB-...";
  dateNode.textContent = formatDate(order?.createdAt || order?.localPreparedAt);
  totalNode.textContent = formatPrice(order?.productsTotal || 0);
  nameNode.textContent = order?.customer?.name || "--";
  phoneNode.textContent = order?.customer?.phone || "--";

  const items = Array.isArray(order?.items) ? order.items : [];
  if (!items.length) {
    itemsNode.innerHTML = `<p class="receipt-empty">Le resume de commande sera confirme par Jolie Lab Beauty.</p>`;
    return;
  }

  itemsNode.innerHTML = items
    .map(
      (item) => `
        <article class="receipt-item">
          <div>
            <strong>${escapeHtml(item.displayName || item.productName || "Produit")}</strong>
            <span>${formatPrice(item.unitPrice)} x ${Number(item.quantity) || 0}</span>
          </div>
          <b>${formatPrice(item.lineTotal || (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0))}</b>
        </article>
      `,
    )
    .join("");
}

function trackedOrders() {
  return loadJson(TRACKED_KEY, []);
}

function trackOrderSubmitted(order) {
  const orderNumber = order?.orderNumber || requestedOrderNumber;
  if (!orderNumber) return;

  const tracked = trackedOrders();
  if (tracked.includes(orderNumber)) return;

  const payload = {
    content_name: "OrderSubmitted",
    currency: "XOF",
    value: Number(order?.productsTotal) || 0,
    order_number: orderNumber,
  };
  const trackedNow = window.JoliePixel
    ? window.JoliePixel.track("Lead", payload)
    : typeof window.fbq === "function" && (window.fbq("track", "Lead", payload), true);

  if (trackedNow) {
    tracked.push(orderNumber);
    localStorage.setItem(TRACKED_KEY, JSON.stringify(tracked.slice(-50)));
  }
}

const order = findOrder();
renderOrder(order);
trackOrderSubmitted(order);
