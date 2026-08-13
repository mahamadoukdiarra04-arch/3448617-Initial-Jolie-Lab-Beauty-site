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

document.querySelectorAll("form[data-confirm-message]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    const message = form.dataset.confirmMessage || "Confirmer cette action ?";
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  });
});

document.querySelectorAll("button[data-confirm-message]").forEach((button) => {
  button.addEventListener("click", (event) => {
    const message = button.dataset.confirmMessage || "Confirmer cette action ?";
    if (!window.confirm(message)) {
      event.preventDefault();
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
  const price = adminParsePrice(value);
  if (price <= 0) return "Prix";
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
}

function adminParsePrice(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  return digits ? Number(digits) || 0 : 0;
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
      <input name="variant_prices[]" type="text" inputmode="numeric" placeholder="13000" />
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

function adminSetFieldError(field, message) {
  if (!field) return;

  field.classList.add("is-field-error");
  field.setAttribute("aria-invalid", "true");

  const label = field.closest("label");
  if (!label) return;

  let error = label.querySelector("[data-field-error]");
  if (!error) {
    error = document.createElement("span");
    error.className = "product-field-error";
    error.dataset.fieldError = "";
    label.append(error);
  }
  error.textContent = message;
}

function adminClearFieldError(field) {
  if (!field) return;

  field.classList.remove("is-field-error");
  field.removeAttribute("aria-invalid");

  const label = field.closest("label");
  label?.querySelector("[data-field-error]")?.remove();
}

function adminShowProductValidation(form, errors) {
  let alert = form.parentElement?.querySelector("[data-product-client-error]");
  if (!alert) {
    alert = document.createElement("section");
    alert.className = "admin-alert is-error product-client-error";
    alert.dataset.productClientError = "";
    form.before(alert);
  }

  const uniqueMessages = [...new Set(errors.map((item) => item.message))];
  alert.innerHTML = `
    <strong>Produit incomplet.</strong>
    <span>${uniqueMessages.join(" ")}</span>
  `;
  alert.scrollIntoView({ block: "start", behavior: "smooth" });
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
  const descriptionInput = form.querySelector('[name="description"]');
  const formMode = form.dataset.productMode || "edit";
  let productSubmitter = null;

  function variantRows() {
    return variantList ? Array.from(variantList.querySelectorAll("[data-variant-row]")) : [];
  }

  function variantPriceFromRow(row) {
    const field = row?.querySelector('[name="variant_prices[]"]');
    return adminParsePrice(field?.value);
  }

  function defaultVariantPrice() {
    const rows = variantRows();
    const checked = variantList?.querySelector('[name="variant_default"]:checked');
    const checkedRow = checked?.closest("[data-variant-row]");
    const checkedPrice = variantPriceFromRow(checkedRow);
    if (checkedPrice > 0) return checkedPrice;

    for (const row of rows) {
      const price = variantPriceFromRow(row);
      if (price > 0) return price;
    }

    return 0;
  }

  function mainDisplayPrice() {
    return adminParsePrice(priceInput?.value) || defaultVariantPrice();
  }

  function normalizePriceField(field) {
    if (!field) return;
    const price = adminParsePrice(field.value);
    if (price > 0) field.value = String(price);
  }

  function preparePricesForSubmit() {
    normalizePriceField(priceInput);
    variantRows().forEach((row) => normalizePriceField(row.querySelector('[name="variant_prices[]"]')));

    if (priceInput && adminParsePrice(priceInput.value) <= 0) {
      const fallbackPrice = defaultVariantPrice();
      if (fallbackPrice > 0) priceInput.value = String(fallbackPrice);
    }
  }

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
    if (previewPrice) previewPrice.textContent = adminFormatPrice(mainDisplayPrice());
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

  form.addEventListener("input", (event) => {
    updateProductPreview();
    if (event.target === imageLines || event.target === videoLines) {
      updateMediaPreview();
    }
  });

  form.addEventListener("input", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
      adminClearFieldError(event.target);
    }
  });

  form.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
      adminClearFieldError(event.target);
    }
  });

  form.addEventListener("click", (event) => {
    const submitter = event.target.closest('button[type="submit"], input[type="submit"]');
    if (submitter && form.contains(submitter)) {
      productSubmitter = submitter;
    }
  });

  form.addEventListener("submit", (event) => {
    const submitter = event.submitter || productSubmitter;
    productSubmitter = null;
    if (submitter?.formNoValidate) return;
    if (submitter?.name === "action" && submitter.value !== "save") return;

    const existingAlert = form.parentElement?.querySelector("[data-product-client-error]");
    existingAlert?.remove();
    form.querySelectorAll(".is-field-error").forEach(adminClearFieldError);

    const errors = [];
    const addError = (field, message) => {
      errors.push({ field, message });
      adminSetFieldError(field, message);
    };

    if (!nameInput?.value.trim()) {
      addError(nameInput, "Saisissez le nom du produit.");
    }

    if (categoryInput?.value === "__new__" && !newCategoryInput?.value.trim()) {
      addError(newCategoryInput, "Saisissez le nom de la nouvelle categorie.");
    }

    if (!descriptionInput?.value.trim()) {
      addError(descriptionInput, "Ajoutez la description originale.");
    }

    let hasVariantPrice = false;
    variantRows().forEach((row) => {
      const fields = Array.from(row.querySelectorAll("input"));
      const keyField = fields.find((field) => field.name === "variant_ids[]");
      const nameField = fields.find((field) => field.name === "variant_names[]");
      const priceField = fields.find((field) => field.name === "variant_prices[]");
      const hasVariant = [keyField, nameField, priceField].some((field) => field?.value.trim());
      const price = adminParsePrice(priceField?.value);

      if (!hasVariant) return;
      if (!nameField?.value.trim()) addError(nameField, "Completez le nom de cette variante.");
      if (price <= 0) {
        addError(priceField, "Indiquez le prix de chaque variante commencee.");
      } else {
        hasVariantPrice = true;
      }
    });

    if (adminParsePrice(priceInput?.value) <= 0 && !hasVariantPrice) {
      addError(priceInput, "Indiquez le prix principal ou au moins une variante avec prix.");
    }

    if (!errors.length) {
      preparePricesForSubmit();
      return;
    }

    event.preventDefault();
    adminShowProductValidation(form, errors);
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

  if (formMode === "new") {
    window.requestAnimationFrame(() => {
      if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      if (nameInput && !nameInput.value.trim() && window.matchMedia("(hover: hover)").matches) {
        nameInput.focus({ preventScroll: true });
      }
    });
  }
});

function adminWithTimeout(promise, duration, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), duration);
  });

  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}

function adminIsIosDevice() {
  const platform = navigator.platform || "";
  const agent = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(agent) || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function adminIsStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

const jolieAdminServiceWorker = (() => {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) {
    return Promise.resolve(null);
  }

  return adminWithTimeout(
    navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(() => null),
    12000,
    "Service de notification trop lent. Rechargez la page puis reessayez."
  ).catch(() => null);
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
  const response = await adminWithTimeout(
    fetch("push-key.php", {
      headers: { Accept: "application/json" },
    }),
    12000,
    "Verification serveur trop lente. Verifiez la connexion puis reessayez."
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok || !payload.publicKey) {
    throw new Error(payload.message || "Configuration push indisponible.");
  }

  return payload.publicKey;
}

async function adminSavePushSubscription(subscription) {
  const response = await adminWithTimeout(
    fetch("push-subscription.php", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription.toJSON()),
    }),
    12000,
    "Enregistrement de cet appareil trop lent. Reessayez dans quelques secondes."
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || "Impossible d'enregistrer cet appareil.");
  }

  return payload;
}

async function adminEnablePushNotifications() {
  if (adminIsIosDevice() && !adminIsStandaloneApp()) {
    throw new Error("Sur iPhone, ajoutez d'abord l'admin a l'ecran d'accueil, puis ouvrez l'icone Jolie Admin.");
  }

  if (!adminSupportsPush()) {
    throw new Error(adminIsIosDevice() ? "Mettez l'iPhone a jour puis ouvrez l'admin depuis son icone." : "Ce navigateur ne supporte pas les notifications push.");
  }

  const permission = await adminWithTimeout(
    Notification.requestPermission(),
    30000,
    "Autorisation non validee. Touchez Autoriser quand la demande du navigateur apparait."
  );
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
    subscription = await adminWithTimeout(
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: adminUrlBase64ToUint8Array(publicKey),
      }),
      20000,
      "Creation de l'abonnement trop lente. Rechargez l'admin puis reessayez."
    );
  }

  await adminSavePushSubscription(subscription);
  return subscription;
}

async function adminShowTestNotification() {
  if (!adminSupportsPush() || Notification.permission !== "granted") {
    throw new Error("Autorisez d'abord les notifications sur cet appareil.");
  }

  const notificationOptions = {
    body: "Test reussi. Cet appareil peut afficher les notifications Jolie Lab Beauty.",
    tag: "jolie-admin-test",
    icon: "../assets/brand/logo.png",
    data: { url: "index.php" },
  };
  const registration = await jolieAdminServiceWorker;
  if (registration?.showNotification) {
    await registration.showNotification("Notification test Jolie Lab", notificationOptions);
    return;
  }

  const notification = new Notification("Notification test Jolie Lab", notificationOptions);
  notification.onclick = () => {
    window.focus();
    window.location.href = "index.php";
  };
}

document.querySelectorAll("[data-admin-notifications]").forEach((root) => {
  const enableButton = root.querySelector("[data-enable-admin-notifications]");
  const installButton = root.querySelector("[data-install-admin-app]");
  const iosHelpButton = root.querySelector("[data-ios-install-help]");
  const testButton = root.querySelector("[data-test-admin-notification]");
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
    const isIos = adminIsIosDevice();
    const isStandalone = adminIsStandaloneApp();

    if (installButton) {
      installButton.hidden = !deferredInstallPrompt;
      if (!installButton.disabled) installButton.textContent = "Installer";
    }

    if (iosHelpButton) {
      iosHelpButton.hidden = !(isIos && !isStandalone);
    }

    if (testButton) {
      testButton.hidden = !adminSupportsPush() || !("Notification" in window) || Notification.permission !== "granted";
    }

    if (isIos && !isStandalone) {
      if (enableButton) enableButton.hidden = true;
      setText(message || "iPhone detecte : ajoutez l'admin a l'ecran d'accueil, ouvrez l'icone Jolie Admin, puis autorisez les notifications.");
      return;
    }

    if (!adminSupportsPush()) {
      if (enableButton) enableButton.hidden = true;
      setText(message || "Alertes internes actives. Les notifications hors page ne sont pas disponibles sur ce navigateur.");
      return;
    }

    if (Notification.permission === "granted") {
      if (enableButton) {
        enableButton.hidden = false;
        enableButton.textContent = "Synchroniser";
      }
      setText(message || "Notifications actives. Cet appareil recevra les nouvelles commandes, meme hors de l'admin.");
      return;
    }

    if (enableButton) {
      enableButton.hidden = Notification.permission === "denied";
      enableButton.textContent = "Autoriser";
    }
    setText(message || adminNotificationLabel());
  }

  function showIosInstallGuide() {
    let panel = document.querySelector("[data-ios-install-guide]");
    if (!panel) {
      panel = document.createElement("div");
      panel.className = "admin-notification-guide";
      panel.setAttribute("data-ios-install-guide", "");
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.innerHTML = `
        <div class="admin-notification-guide-card">
          <button class="admin-guide-close" type="button" data-close-ios-guide aria-label="Fermer">x</button>
          <strong>Activer les notifications sur iPhone</strong>
          <ol>
            <li>Ouvrez cette page admin dans Safari.</li>
            <li>Touchez le bouton Partager.</li>
            <li>Choisissez Ajouter a l'ecran d'accueil.</li>
            <li>Ouvrez l'icone Jolie Admin ajoutee sur l'ecran d'accueil.</li>
            <li>Touchez Autoriser, puis acceptez la demande iOS.</li>
          </ol>
          <p>Sur iPhone, Apple autorise les notifications web uniquement depuis l'app ajoutee a l'ecran d'accueil.</p>
        </div>
      `;
      document.body.append(panel);
      panel.addEventListener("click", (event) => {
        if (event.target === panel || event.target.closest("[data-close-ios-guide]")) {
          panel.hidden = true;
        }
      });
    }
    panel.hidden = false;
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
    if (adminIsIosDevice() && !adminIsStandaloneApp()) {
      updatePermissionUi();
      return;
    }

    try {
      const alerts = await fetchAlerts();
      const latestOrder = alerts.latest_order || null;
      const newOrder = alerts.new_order || null;
      const latestId = Number(latestOrder?.id) || 0;
      const newCount = Number(alerts.new_orders) || 0;

      if (newCount > 0) {
        setText(`${newCount} nouvelle(s) commande(s) en attente. ${adminNotificationLabel()}`);
      } else if ("Notification" in window && Notification.permission === "granted") {
        setText("Aucune nouvelle commande. Notifications actives sur cet appareil.");
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
    updatePermissionUi("Vous pouvez installer l'admin sur cet appareil.");
  });

  installButton?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    installButton.disabled = true;
    installButton.textContent = "Installation...";

    try {
      deferredInstallPrompt.prompt();
      await adminWithTimeout(
        deferredInstallPrompt.userChoice.catch(() => null),
        15000,
        "Installation non confirmee. Utilisez le menu du navigateur si rien ne s'affiche."
      );
      deferredInstallPrompt = null;
      updatePermissionUi("Ouvrez l'icone Jolie Admin installee, puis touchez Autoriser.");
    } catch (error) {
      updatePermissionUi(error.message || "Installation non terminee.");
    } finally {
      installButton.disabled = false;
    }
  });

  iosHelpButton?.addEventListener("click", showIosInstallGuide);

  testButton?.addEventListener("click", async () => {
    testButton.disabled = true;
    testButton.textContent = "Test...";

    try {
      await adminShowTestNotification();
      updatePermissionUi("Notification test envoyee sur cet appareil.");
    } catch (error) {
      updatePermissionUi(error.message || "Impossible d'envoyer la notification test.");
    } finally {
      testButton.disabled = false;
      testButton.textContent = "Tester";
    }
  });

  enableButton?.addEventListener("click", async () => {
    if (enableButton) {
      enableButton.disabled = true;
      enableButton.textContent = "Verification...";
    }

    try {
      await adminEnablePushNotifications();
      updatePermissionUi("Notifications activees. Les nouvelles commandes seront signalees sur cet appareil.");
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
