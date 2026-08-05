document.querySelectorAll(".order-update-form").forEach((form) => {
  const deliveryInput = form.querySelector('[name="delivery_fee"]');
  if (!deliveryInput) return;

  deliveryInput.addEventListener("input", () => {
    if (deliveryInput.value && Number(deliveryInput.value) < 0) {
      deliveryInput.setCustomValidity("Le prix de livraison doit etre positif.");
    } else {
      deliveryInput.setCustomValidity("");
    }
  });
});

function adminSlugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function adminFormatPrice(value) {
  const price = Number(value) || 0;
  if (price <= 0) return "Prix";
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
}

function adminMediaUrl(url) {
  if (!url) return "../assets/brand/hero-01.jpeg";
  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:") || url.startsWith("/")) return url;
  return "../" + url.replace(/^\/+/, "");
}

function adminParseMediaLines(value) {
  return String(value || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [url, label = ""] = line.split("|").map((part) => part.trim());
      return { url, label };
    })
    .filter((item) => item.url);
}

function adminRenumberVariants(list) {
  list.querySelectorAll("[data-variant-row]").forEach((row, index) => {
    const radio = row.querySelector('[name="variant_default"]');
    if (radio) radio.value = String(index);
  });

  const checked = list.querySelector('[name="variant_default"]:checked');
  const first = list.querySelector('[name="variant_default"]');
  if (!checked && first) first.checked = true;
}

function adminCreateVariantRow(list) {
  const row = document.createElement("div");
  row.className = "variant-admin-row";
  row.dataset.variantRow = "";
  row.innerHTML = `
    <label>
      Cle
      <input name="variant_ids[]" type="text" placeholder="petit" />
    </label>
    <label>
      Nom
      <input name="variant_names[]" type="text" placeholder="Petit complet" />
    </label>
    <label>
      Prix
      <input name="variant_prices[]" type="number" min="1" step="500" placeholder="13000" />
    </label>
    <label class="variant-radio">
      <input name="variant_default" type="radio" value="0" />
      <span>Defaut</span>
    </label>
    <button class="admin-button is-muted" type="button" data-remove-variant>Retirer</button>
  `;
  list.appendChild(row);
  adminRenumberVariants(list);
}

document.querySelectorAll("[data-product-admin-form]").forEach((form) => {
  const nameInput = form.querySelector("[data-product-name]");
  const slugInput = form.querySelector("[data-product-slug]");
  const categoryInput = form.querySelector("[data-product-category]");
  const priceInput = form.querySelector("[data-product-price]");
  const imageLines = form.querySelector('[data-media-lines="image"]');
  const videoLines = form.querySelector('[data-media-lines="video"]');
  const mediaPreview = form.querySelector("[data-media-preview]");
  const previewImage = form.querySelector("[data-preview-image]");
  const previewName = form.querySelector("[data-preview-name]");
  const previewCategory = form.querySelector("[data-preview-category]");
  const previewPrice = form.querySelector("[data-preview-price]");
  const variantList = form.querySelector("[data-variant-list]");

  function updateProductPreview() {
    if (previewName) previewName.textContent = nameInput?.value.trim() || "Nom du produit";
    if (previewCategory) previewCategory.textContent = categoryInput?.value || "Categorie";
    if (previewPrice) previewPrice.textContent = adminFormatPrice(priceInput?.value);
    const firstImage = adminParseMediaLines(imageLines?.value || "")[0]?.url;
    if (previewImage) previewImage.src = adminMediaUrl(firstImage || "");
  }

  function updateMediaPreview() {
    if (!mediaPreview) return;
    mediaPreview.innerHTML = "";

    const images = adminParseMediaLines(imageLines?.value || "").map((item) => ({ ...item, type: "image" }));
    const videos = adminParseMediaLines(videoLines?.value || "").map((item) => ({ ...item, type: "video" }));
    [...images, ...videos].slice(0, 8).forEach((item) => {
      const card = document.createElement("article");
      card.className = "media-preview-card";
      const media = document.createElement(item.type === "video" ? "video" : "img");
      media.src = adminMediaUrl(item.url);
      if (item.type === "video") {
        media.muted = true;
        media.controls = true;
        media.playsInline = true;
        media.preload = "metadata";
      }
      if (item.type === "image") {
        media.alt = item.label || "Apercu produit";
      }
      const label = document.createElement("span");
      label.textContent = item.type === "video" ? "Video" : "Image";
      card.append(media, label);
      mediaPreview.appendChild(card);
    });
  }

  nameInput?.addEventListener("blur", () => {
    if (slugInput && !slugInput.value.trim()) {
      slugInput.value = adminSlugify(nameInput.value);
    }
  });

  form.addEventListener("input", () => {
    updateProductPreview();
    updateMediaPreview();
  });

  form.addEventListener("click", (event) => {
    if (event.target.closest("[data-add-variant]") && variantList) {
      adminCreateVariantRow(variantList);
    }

    const remove = event.target.closest("[data-remove-variant]");
    if (remove && variantList) {
      const row = remove.closest("[data-variant-row]");
      if (row && variantList.querySelectorAll("[data-variant-row]").length > 1) {
        row.remove();
        adminRenumberVariants(variantList);
      } else if (row) {
        row.querySelectorAll("input").forEach((input) => {
          if (input.type === "radio") {
            input.checked = true;
          } else {
            input.value = "";
          }
        });
      }
    }
  });

  if (variantList) adminRenumberVariants(variantList);
  updateProductPreview();
  updateMediaPreview();
});

document.querySelectorAll("[data-admin-notifications]").forEach((root) => {
  const enableButton = root.querySelector("[data-enable-admin-notifications]");
  const textNode = root.querySelector("[data-admin-notification-text]");
  const storageKey = "jolieAdminLastOrderId";
  let lastOrderId = Number(localStorage.getItem(storageKey)) || 0;
  let initialized = false;

  function setText(message) {
    if (textNode) textNode.textContent = message;
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("fr-FR").format(Number(value) || 0) + " FCFA";
  }

  function canNotify() {
    return "Notification" in window && window.isSecureContext;
  }

  function updatePermissionUi() {
    root.hidden = false;
    if (!canNotify()) {
      if (enableButton) enableButton.hidden = true;
      setText("Alertes visuelles actives. Notifications navigateur disponibles en HTTPS.");
      return;
    }

    if (Notification.permission === "granted") {
      if (enableButton) enableButton.hidden = true;
      setText("Notifications navigateur actives pour les nouvelles commandes.");
      return;
    }

    if (enableButton) enableButton.hidden = false;
    setText("Activez les notifications navigateur pour cet appareil admin.");
  }

  function showBrowserNotification(order) {
    if (!canNotify() || Notification.permission !== "granted" || !order) return;
    const notification = new Notification("Nouvelle commande Jolie Lab Beauty", {
      body: `${order.order_number} - ${order.customer_name || "Cliente"} - ${formatPrice(order.products_total)}`,
      tag: `jolie-order-${order.id}`,
      icon: "../assets/brand/logo.png",
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = `order.php?id=${order.id}`;
    };
  }

  async function fetchAlerts() {
    const response = await fetch(`order-alerts.php?after=${encodeURIComponent(lastOrderId)}`, {
      headers: { Accept: "application/json" },
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || "Alertes indisponibles.");
    }
    return payload.alerts || {};
  }

  async function pollAlerts() {
    try {
      const alerts = await fetchAlerts();
      const latestOrder = alerts.latest_order || null;
      const newOrder = alerts.new_order || null;
      const latestId = Number(latestOrder?.id) || 0;
      const newCount = Number(alerts.new_orders) || 0;

      if (newCount > 0) {
        setText(`${newCount} nouvelle(s) commande(s) en attente.`);
      } else {
        setText("Aucune nouvelle commande pour le moment.");
      }

      if (!initialized) {
        initialized = true;
        if (latestId > lastOrderId) {
          lastOrderId = latestId;
          localStorage.setItem(storageKey, String(lastOrderId));
        }
        return;
      }

      if (newOrder && Number(newOrder.id) > lastOrderId) {
        lastOrderId = Number(newOrder.id);
        localStorage.setItem(storageKey, String(lastOrderId));
        showBrowserNotification(newOrder);
      } else if (latestId > lastOrderId) {
        lastOrderId = latestId;
        localStorage.setItem(storageKey, String(lastOrderId));
      }
    } catch {
      setText("Alertes commandes indisponibles pour le moment.");
    }
  }

  enableButton?.addEventListener("click", async () => {
    if (!canNotify()) {
      updatePermissionUi();
      return;
    }
    const permission = await Notification.requestPermission();
    updatePermissionUi();
  });

  updatePermissionUi();
  pollAlerts();
  window.setInterval(pollAlerts, 45000);
});
