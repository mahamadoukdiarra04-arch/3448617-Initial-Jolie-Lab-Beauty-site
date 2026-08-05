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

function adminMediaLine(item) {
  if (!item?.url) return "";
  return item.label ? `${item.url} | ${item.label}` : item.url;
}

function adminSetMediaLines(textarea, items) {
  if (!textarea) return;
  textarea.value = items.map(adminMediaLine).filter(Boolean).join("\n");
}

function adminFilesFromInput(input) {
  return input?.files ? Array.from(input.files) : [];
}

function adminRemoveFileAt(input, removeIndex) {
  if (!input?.files) return;

  if (typeof DataTransfer === "undefined") {
    input.value = "";
    return;
  }

  const transfer = new DataTransfer();
  adminFilesFromInput(input).forEach((file, index) => {
    if (index !== removeIndex) transfer.items.add(file);
  });
  input.files = transfer.files;
}

function adminFileLabel(fileName) {
  return String(fileName || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
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
  const newCategoryField = form.querySelector("[data-new-category-field]");
  const newCategoryInput = form.querySelector("[data-new-category]");
  const priceInput = form.querySelector("[data-product-price]");
  const imageLines = form.querySelector('[data-media-lines="image"]');
  const videoLines = form.querySelector('[data-media-lines="video"]');
  const imageUpload = form.querySelector('[data-media-upload="image"]');
  const videoUpload = form.querySelector('[data-media-upload="video"]');
  const mediaPreview = form.querySelector("[data-media-preview]");
  const previewImage = form.querySelector("[data-preview-image]");
  const previewName = form.querySelector("[data-preview-name]");
  const previewCategory = form.querySelector("[data-preview-category]");
  const previewPrice = form.querySelector("[data-preview-price]");
  const variantList = form.querySelector("[data-variant-list]");

  function currentCategoryLabel() {
    if (categoryInput?.value === "__new__") {
      return newCategoryInput?.value.trim() || "Nouvelle categorie";
    }
    return categoryInput?.value || "Categorie";
  }

  function updateCategoryMode() {
    const isNewCategory = categoryInput?.value === "__new__";
    if (newCategoryField) newCategoryField.hidden = !isNewCategory;
    if (newCategoryInput) newCategoryInput.required = Boolean(isNewCategory);
    if (!isNewCategory && newCategoryInput) newCategoryInput.value = "";
  }

  function updateProductPreview() {
    if (previewName) previewName.textContent = nameInput?.value.trim() || "Nom du produit";
    if (previewCategory) previewCategory.textContent = currentCategoryLabel();
    if (previewPrice) previewPrice.textContent = adminFormatPrice(priceInput?.value);
    const firstImage = adminParseMediaLines(imageLines?.value || "")[0]?.url;
    const firstPendingImage = adminFilesFromInput(imageUpload)[0];
    if (previewImage) {
      previewImage.src = firstImage ? adminMediaUrl(firstImage) : firstPendingImage ? URL.createObjectURL(firstPendingImage) : adminMediaUrl("");
    }
  }

  function updateMediaPreview() {
    if (!mediaPreview) return;
    mediaPreview.innerHTML = "";

    const images = adminParseMediaLines(imageLines?.value || "").map((item, index) => ({ ...item, type: "image", source: "stored", index }));
    const videos = adminParseMediaLines(videoLines?.value || "").map((item, index) => ({ ...item, type: "video", source: "stored", index }));
    const pendingImages = adminFilesFromInput(imageUpload).map((file, index) => ({
      type: "image",
      source: "pending",
      index,
      url: URL.createObjectURL(file),
      label: adminFileLabel(file.name),
    }));
    const pendingVideos = adminFilesFromInput(videoUpload).map((file, index) => ({
      type: "video",
      source: "pending",
      index,
      url: URL.createObjectURL(file),
      label: adminFileLabel(file.name),
    }));
    const mediaItems = [...images, ...videos, ...pendingImages, ...pendingVideos];

    if (!mediaItems.length) {
      const empty = document.createElement("p");
      empty.className = "media-empty-state";
      empty.textContent = "Aucun media ajoute pour le moment.";
      mediaPreview.appendChild(empty);
      return;
    }

    mediaItems.forEach((item) => {
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
      label.textContent = item.source === "pending" ? "A enregistrer" : item.type === "video" ? "Video" : "Image";
      const name = document.createElement("small");
      name.textContent = item.label || item.url;
      const removeButton = document.createElement("button");
      removeButton.className = "admin-button is-muted";
      removeButton.type = "button";
      removeButton.dataset.removeMedia = "";
      removeButton.dataset.mediaType = item.type;
      removeButton.dataset.mediaSource = item.source;
      removeButton.dataset.mediaIndex = String(item.index);
      removeButton.textContent = "Retirer";
      card.append(media, label, name, removeButton);
      mediaPreview.appendChild(card);
    });
  }

  nameInput?.addEventListener("blur", () => {
    if (slugInput && !slugInput.value.trim()) {
      slugInput.value = adminSlugify(nameInput.value);
    }
  });

  categoryInput?.addEventListener("change", () => {
    updateCategoryMode();
    updateProductPreview();
  });

  imageUpload?.addEventListener("change", () => {
    updateProductPreview();
    updateMediaPreview();
  });

  videoUpload?.addEventListener("change", updateMediaPreview);

  form.addEventListener("input", () => {
    updateProductPreview();
    updateMediaPreview();
  });

  form.addEventListener("click", (event) => {
    const removeMedia = event.target.closest("[data-remove-media]");
    if (removeMedia) {
      const type = removeMedia.dataset.mediaType;
      const source = removeMedia.dataset.mediaSource;
      const index = Number(removeMedia.dataset.mediaIndex);
      if (type === "image" && source === "stored") {
        const items = adminParseMediaLines(imageLines?.value || "");
        items.splice(index, 1);
        adminSetMediaLines(imageLines, items);
      }
      if (type === "video" && source === "stored") {
        const items = adminParseMediaLines(videoLines?.value || "");
        items.splice(index, 1);
        adminSetMediaLines(videoLines, items);
      }
      if (type === "image" && source === "pending") {
        adminRemoveFileAt(imageUpload, index);
      }
      if (type === "video" && source === "pending") {
        adminRemoveFileAt(videoUpload, index);
      }
      updateProductPreview();
      updateMediaPreview();
      return;
    }

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
  updateCategoryMode();
  updateProductPreview();
  updateMediaPreview();
});

const jolieAdminServiceWorker = (() => {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) {
    return Promise.resolve(null);
  }

  return navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(() => null);
})();

function adminUrlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }

  return output;
}

function adminSupportsPush() {
  return (
    window.isSecureContext &&
    "Notification" in window &&
    "PushManager" in window &&
    "serviceWorker" in navigator
  );
}

function adminNotificationLabel() {
  if (!("Notification" in window)) return "Notifications non disponibles sur ce navigateur.";
  if (Notification.permission === "denied") return "Notifications bloquees dans les reglages du navigateur.";
  if (Notification.permission === "granted") return "Notifications actives sur cet appareil.";
  return "Activez cet appareil pour recevoir les nouvelles commandes.";
}

async function adminFetchPushPublicKey() {
  const response = await fetch("push-key.php", {
    headers: { Accept: "application/json" },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok || !payload.publicKey) {
    throw new Error(payload.message || "Configuration push indisponible.");
  }

  return payload.publicKey;
}

async function adminSavePushSubscription(subscription) {
  const response = await fetch("push-subscription.php", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subscription.toJSON()),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || "Impossible d'enregistrer cet appareil.");
  }

  return payload;
}

async function adminEnablePushNotifications() {
  if (!adminSupportsPush()) {
    throw new Error("Installez l'admin sur le telephone puis ouvrez-le depuis son icone.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Autorisation de notification refusee.");
  }

  const [registration, publicKey] = await Promise.all([
    jolieAdminServiceWorker,
    adminFetchPushPublicKey(),
  ]);
  if (!registration) {
    throw new Error("Service de notification indisponible.");
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: adminUrlBase64ToUint8Array(publicKey),
    });
  }

  await adminSavePushSubscription(subscription);
  return subscription;
}

document.querySelectorAll("[data-admin-notifications]").forEach((root) => {
  const enableButton = root.querySelector("[data-enable-admin-notifications]");
  const installButton = root.querySelector("[data-install-admin-app]");
  const textNode = root.querySelector("[data-admin-notification-text]");
  const storageKey = "jolieAdminLastOrderId";
  let deferredInstallPrompt = null;
  let lastOrderId = Number(localStorage.getItem(storageKey)) || 0;
  let initialized = false;

  function setText(message) {
    if (textNode) textNode.textContent = message;
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("fr-FR").format(Number(value) || 0) + " FCFA";
  }

  function updatePermissionUi(message = "") {
    root.hidden = false;

    if (installButton) {
      installButton.hidden = !deferredInstallPrompt;
    }

    if (!adminSupportsPush()) {
      if (enableButton) enableButton.hidden = true;
      setText(message || "Alertes internes actives. Pour les notifications hors page, ouvrez l'admin depuis son icone installee.");
      return;
    }

    if (Notification.permission === "granted") {
      if (enableButton) {
        enableButton.hidden = false;
        enableButton.textContent = "Synchroniser";
      }
      setText(message || "Notifications actives. Ce telephone recevra les nouvelles commandes.");
      return;
    }

    if (enableButton) {
      enableButton.hidden = Notification.permission === "denied";
      enableButton.textContent = "Activer";
    }
    setText(message || adminNotificationLabel());
  }

  async function showBrowserNotification(order) {
    if (!adminSupportsPush() || Notification.permission !== "granted" || !order) return;

    const notificationOptions = {
      body: `${order.order_number} - ${order.customer_name || "Cliente"} - ${formatPrice(order.products_total)}`,
      tag: `jolie-order-${order.id}`,
      icon: "../assets/brand/logo.png",
      data: { url: `order.php?id=${order.id}` },
    };

    const registration = await jolieAdminServiceWorker;
    if (registration?.showNotification) {
      registration.showNotification("Nouvelle commande Jolie Lab Beauty", notificationOptions);
      return;
    }

    const notification = new Notification("Nouvelle commande Jolie Lab Beauty", notificationOptions);
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
        setText(`${newCount} nouvelle(s) commande(s) en attente. ${adminNotificationLabel()}`);
      } else if ("Notification" in window && Notification.permission === "granted") {
        setText("Aucune nouvelle commande. Notifications actives sur ce telephone.");
      } else {
        setText("Aucune nouvelle commande pour le moment. Activez les notifications pour cet appareil.");
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
        showBrowserNotification(newOrder).catch(() => {});
      } else if (latestId > lastOrderId) {
        lastOrderId = latestId;
        localStorage.setItem(storageKey, String(lastOrderId));
      }
    } catch {
      setText("Alertes commandes indisponibles pour le moment.");
    }
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updatePermissionUi("Vous pouvez installer l'admin sur ce telephone.");
  });

  installButton?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    updatePermissionUi();
  });

  enableButton?.addEventListener("click", async () => {
    if (enableButton) {
      enableButton.disabled = true;
      enableButton.textContent = "Activation...";
    }

    try {
      await adminEnablePushNotifications();
      updatePermissionUi("Notifications activees. Les nouvelles commandes seront signalees sur ce telephone.");
    } catch (error) {
      updatePermissionUi(error.message || "Impossible d'activer les notifications.");
    } finally {
      if (enableButton) enableButton.disabled = false;
    }
  });

  updatePermissionUi();
  pollAlerts();
  window.setInterval(pollAlerts, 45000);
});
