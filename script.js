const CONTACT = {
  phone: "22394307799",
  displayPhone: "+223 94 30 77 99",
  email: "ramatabore31@gmail.com",
};

const categories = ["Tous", "Visage", "Corps", "Cheveux", "Packs", "Accessoires", "Maquillage", "Homme"];

const products = window.JOLIE_PRODUCTS || [
  {
    id: 1,
    name: "Sérum Anti-Acné Intensif",
    category: "Visage",
    price: 12500,
    images: ["product-01-01.jpeg", "product-01-02.jpeg", "product-01-03.jpeg"],
    description: "Soin ciblé pour combattre l'acné et aider la peau à devenir plus nette progressivement.",
    benefits: ["Peau plus nette", "Aide à réduire les boutons", "Routine anti-imperfections"],
  },
  {
    id: 2,
    name: "Masque Stick au Thé Vert Purifiant",
    category: "Visage",
    price: 8000,
    images: ["product-02-01.jpeg", "product-02-02.jpeg", "product-02-03.jpeg"],
    description: "Masque pratique pour nettoyer en profondeur, contrôler l'excès de sébum et réduire l'apparence des points noirs.",
    benefits: ["Nettoie les pores", "Aide contre les points noirs", "Texture stick facile à appliquer"],
  },
  {
    id: 3,
    name: "Spray Solaire SPF50+ Hydratant",
    category: "Visage",
    price: 5000,
    images: ["product-03-01.jpeg", "product-03-02.jpeg", "product-03-03.jpeg"],
    description: "Protection solaire SPF50+ à texture légère pour un usage quotidien, avec une sensation fraîche et confortable.",
    benefits: ["Protection UV SPF50+", "Hydratant sans effet gras", "Résistant à l'eau et à la sueur"],
  },
  {
    id: 4,
    name: "Gel Anti-Acné à l'Acide Salicylique",
    category: "Visage",
    price: 10000,
    images: ["product-04-01.jpeg", "product-04-02.jpeg", "product-04-03.jpeg"],
    description: "Gel purifiant à l'acide salicylique pour aider à désobstruer les pores et lisser la texture de peau.",
    benefits: ["Réduit boutons et imperfections", "Aide à atténuer les taches", "Apaise les rougeurs"],
  },
  {
    id: 5,
    name: "Pack Éclaircissant Kojic Acid",
    category: "Packs",
    price: 11000,
    images: ["product-05-01.jpeg", "product-05-02.jpeg", "product-05-03.jpeg", "product-05-04.jpeg"],
    description: "Pack complet avec savon, crème et sérum pour purifier, hydrater et illuminer progressivement le teint.",
    benefits: ["Savon purifiant", "Crème hydratante", "Sérum anti-taches"],
  },
  {
    id: 6,
    name: "Castor-NF Anti-Imperfections",
    category: "Corps",
    price: 7500,
    images: ["product-06-01.jpeg", "product-06-02.jpeg", "product-06-03.jpeg", "product-06-04.jpeg"],
    description: "Traitement anti-imperfections pour une peau plus nette, plus lisse et progressivement plus uniforme.",
    benefits: ["Aide contre les taches", "Aide contre les vergetures", "Améliore progressivement le teint"],
  },
  {
    id: 7,
    name: "Pack Éclat & Réparation AHA + Bio-Oil",
    category: "Packs",
    price: 18000,
    images: ["product-07-01.jpeg"],
    description: "Routine corps avec gel douche AHA, lait AHA et Bio-Oil pour exfolier, nourrir et illuminer.",
    benefits: ["Exfolie en douceur", "Aide à atténuer taches et vergetures", "Teint plus uniforme"],
  },
  {
    id: 8,
    name: "Soin Anti-Rides Contour des Yeux",
    category: "Visage",
    price: 7500,
    images: ["product-08-01.jpeg", "product-08-02.jpeg", "product-08-03.jpeg"],
    description: "Soin contour des yeux pour hydrater, lisser et raviver le regard fatigué.",
    benefits: ["Réduit rides et ridules", "Aide contre cernes et poches", "Hydrate la zone délicate"],
  },
  {
    id: 9,
    name: "Pack Visage Vitamine C SADOER",
    category: "Packs",
    price: 15000,
    images: ["product-09-01.jpeg", "product-09-02.jpeg", "product-09-03.jpeg"],
    description: "Routine visage à la vitamine C pour nettoyer, hydrater et aider à uniformiser le teint.",
    benefits: ["Nettoyant purifiant", "Sérum éclat", "Crème et toner pour peau lumineuse"],
  },
  {
    id: 10,
    name: "Sérum Éclaircissant Articulations",
    category: "Corps",
    price: 15000,
    images: ["product-10-01.jpeg", "product-10-02.jpeg", "product-10-03.jpeg"],
    description: "Sérum ciblé pour les zones sombres comme les doigts, coudes, genoux et jointures.",
    benefits: ["Cible les zones sombres", "Hydrate et adoucit", "Améliore l'apparence des articulations"],
  },
  {
    id: 11,
    name: "Crème Noor Gold No Marks",
    category: "Visage",
    price: 3500,
    images: ["product-11-01.jpeg"],
    description: "Crème visage enrichie pour aider à unifier le teint et apporter de l'éclat à la peau.",
    benefits: ["Aide contre les marques", "Éclat et douceur", "Teint plus uniforme"],
  },
  {
    id: 12,
    name: "Pack Jhalak Éclaircissant Visage",
    category: "Packs",
    price: 5000,
    images: ["product-12-01.jpeg", "product-12-02.jpeg", "product-12-03.jpeg"],
    description: "Duo sérum et crème pour cibler les taches, illuminer le teint et hydrater le visage.",
    benefits: ["Sérum éclat", "Crème nourrissante", "Aide contre taches et boutons"],
  },
  {
    id: 13,
    name: "Gel Nettoyant au Caviar Doré",
    category: "Visage",
    price: 6500,
    images: ["product-13-01.jpeg"],
    description: "Gel nettoyant enrichi en caviar doré et vitamine C pour une peau propre, fraîche et lumineuse.",
    benefits: ["Nettoie en profondeur", "Élimine l'excès de sébum", "Illumine le teint"],
  },
  {
    id: 14,
    name: "Mousse Nettoyante SADOER Hyaluronique",
    category: "Visage",
    price: 6000,
    images: ["product-14-01.jpeg", "product-14-02.jpeg"],
    description: "Mousse nettoyante douce avec brosse intégrée, acides aminés et acide hyaluronique.",
    benefits: ["Nettoie les pores", "Hydrate et rafraîchit", "Brosse intégrée"],
  },
  {
    id: 15,
    name: "Lingettes Démaquillantes & Nettoyantes",
    category: "Accessoires",
    price: 3000,
    images: ["product-15-01.jpeg", "product-15-02.jpeg"],
    description: "Lingettes pratiques pour démaquiller et nettoyer la peau au quotidien.",
    benefits: ["Nettoyage rapide", "Peau fraîche", "Format pratique"],
  },
  {
    id: 16,
    name: "Gants Exfoliants Doux",
    category: "Accessoires",
    price: 1500,
    images: ["product-16-01.jpeg", "product-16-02.jpeg"],
    description: "Paire de gants exfoliants pour nettoyer en profondeur et retirer les cellules mortes.",
    benefits: ["Vendu en paire", "Exfolie en douceur", "Couleurs variées"],
  },
  {
    id: 17,
    name: "Éponges de Maquillage Douces",
    category: "Accessoires",
    price: 3000,
    images: ["product-17-01.jpeg"],
    description: "Lot d'éponges souples pour appliquer fond de teint, poudre ou correcteur avec un fini lisse.",
    benefits: ["Utilisable sèche ou humide", "Application uniforme", "Lot pratique"],
  },
  {
    id: 18,
    name: "Complet Luxe Hair",
    category: "Cheveux",
    price: 13000,
    priceNote: "Petit 13 000 FCFA • Grand 17 000 FCFA",
    images: ["product-18-01.jpeg", "product-18-02.jpeg"],
    description: "Routine capillaire anti-chute pour fortifier, réparer et accompagner la pousse des cheveux.",
    benefits: ["Aide à accélérer la pousse", "Combat la chute", "Petit et grand complet disponibles"],
  },
  {
    id: 19,
    name: "Kit Repousse Barbe & Anti-Calvitie",
    category: "Homme",
    price: 12500,
    images: ["product-19-01.jpeg", "product-19-02.jpeg"],
    description: "Kit dermaroller et huile Luxe Hair pour stimuler les zones clairsemées de la barbe ou des cheveux.",
    benefits: ["Stimule les follicules", "Huile nourrissante", "Barbe et cheveux plus denses"],
  },
];

const state = {
  filter: "Tous",
  search: "",
  cart: loadCart(),
  modalProduct: null,
};

const productGrid = document.querySelector("[data-products]");
const filterWrap = document.querySelector("[data-filters]");
const searchInput = document.querySelector("[data-search]");
const cartDrawer = document.querySelector("[data-cart]");
const cartItems = document.querySelector("[data-cart-items]");
const cartCount = document.querySelector("[data-cart-count]");
const cartTotal = document.querySelector("[data-cart-total]");
const orderForm = document.querySelector("[data-order-form]");
const checkoutLink = document.querySelector("[data-checkout-link]");
const modal = document.querySelector("[data-modal]");
const modalImage = document.querySelector("[data-modal-image]");
const modalThumbs = document.querySelector("[data-modal-thumbs]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalDescription = document.querySelector("[data-modal-description]");
const modalBenefits = document.querySelector("[data-modal-benefits]");
const modalPrice = document.querySelector("[data-modal-price]");
const modalVariant = document.querySelector("[data-modal-variant]");
const modalCategory = document.querySelector("[data-modal-category]");
const modalAdd = document.querySelector("[data-modal-add]");
const modalSku = document.querySelector("[data-modal-sku]");
const modalSuited = document.querySelector("[data-modal-suited]");
const modalUsage = document.querySelector("[data-modal-usage]");
const modalRelated = document.querySelector("[data-related-products]");
const modalWhatsApp = document.querySelector("[data-modal-whatsapp]");
const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");

function formatPrice(price) {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
}

function productImage(file) {
  if (file.startsWith("assets/")) return file;
  return `assets/products/${file}`;
}

function escapeHtml(value) {
  return String(value)
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

function productPriceLabel(product) {
  if (Array.isArray(product.variants) && product.variants.length) {
    return product.variants.map((variant) => `${variant.name} ${formatPrice(variant.price)}`).join(" • ");
  }
  return product.priceNote || formatPrice(product.price);
}

function selectedVariantId(productId, scope = document) {
  const select = scope.querySelector(`[data-variant-select="${productId}"]`);
  return select?.value || "";
}

function variantSelectMarkup(product, context) {
  if (!Array.isArray(product.variants) || !product.variants.length) return "";
  const fieldId = `${context}-variant-${product.id}`;
  return `
    <label class="variant-field" for="${fieldId}">
      <span>Choisir le format</span>
      <select id="${fieldId}" data-variant-select="${product.id}" required>
        <option value="">Sélectionner un format</option>
        ${product.variants
          .map((variant) => `<option value="${escapeHtml(variant.id)}">${escapeHtml(variant.name)} - ${formatPrice(variant.price)}</option>`)
          .join("")}
      </select>
    </label>
  `;
}

function productBenefits(product) {
  if (Array.isArray(product.benefits) && product.benefits.length) return product.benefits;
  return product.description
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(titre|description|bienfaits|conseils d’utilisation|conseils d'utilisation)\s*:?\s*$/i.test(line))
    .filter((line) => !/\d[\d\s]*(?:fcfa|f)\b/i.test(line))
    .slice(0, 3);
}

function productSlug(product) {
  return product.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getSuitedFor(product) {
  const name = product.name.toLowerCase();
  if (name.includes("solaire")) return "Les clientes qui veulent protéger leur peau au quotidien, surtout pendant une routine éclat ou anti-taches.";
  if (name.includes("acné") || name.includes("imperfection")) return "Les peaux sujettes aux boutons, marques visibles, excès de sébum ou texture irrégulière.";
  if (name.includes("cheveux") || name.includes("hair")) return "Les routines capillaires qui ciblent la casse, la chute, la pousse ou le manque de volume.";
  if (name.includes("barbe") || product.category === "Homme") return "Les hommes qui souhaitent entretenir la barbe, le cuir chevelu ou les zones clairsemées.";
  if (product.category === "Accessoires") return "Les routines beauté quotidiennes qui ont besoin d'un accessoire pratique, simple et facile à nettoyer.";
  if (product.category === "Packs") return "Les clientes qui préfèrent une routine complète avec plusieurs produits complémentaires.";
  if (product.category === "Corps") return "Les soins corps orientés douceur, confort, éclat et aspect plus uniforme de la peau.";
  return "Les routines visage qui recherchent un soin ciblé, facile à intégrer au quotidien.";
}

function getUsageAdvice(product) {
  const name = product.name.toLowerCase();
  if (name.includes("solaire")) return "Appliquer avant l'exposition au soleil et renouveler régulièrement. Éviter le contact direct avec les yeux.";
  if (name.includes("masque")) return "Appliquer sur peau propre, laisser poser selon la tolérance de la peau, puis rincer. Commencer doucement si la peau est sensible.";
  if (name.includes("gants")) return "Utiliser sous la douche avec savon ou gel douche, puis hydrater la peau. Ne pas frotter trop fort sur peau irritée.";
  if (name.includes("éponges")) return "Utiliser sèche ou humide selon le fini souhaité, puis laver et laisser sécher après usage.";
  if (name.includes("lingettes")) return "Utiliser pour retirer maquillage ou impuretés, puis compléter avec un soin adapté si besoin.";
  if (name.includes("cheveux") || name.includes("hair") || name.includes("barbe")) return "Appliquer régulièrement selon la routine choisie. Demander confirmation sur WhatsApp pour la fréquence conseillée.";
  if (product.category === "Packs") return "Utiliser les produits du pack dans l'ordre conseillé au moment de la commande. Faire un test sur une petite zone si la peau est sensible.";
  if (product.category === "Visage") return "Appliquer sur peau propre et commencer progressivement. Éviter le contour des yeux et demander conseil en cas de peau sensible.";
  return "Utiliser selon le besoin ciblé et confirmer la routine complète sur WhatsApp avant commande.";
}

function getProductWhatsAppUrl(product) {
  const text = `Bonjour Jolie Lab Beauty, je souhaite avoir des informations sur : ${product.name} (${product.priceNote || formatPrice(product.price)}).`;
  return `https://wa.me/${CONTACT.phone}?text=${encodeURIComponent(text)}`;
}

function loadCart() {
  try {
    return normalizeCart(JSON.parse(localStorage.getItem("jolieLabCart")) || {});
  } catch {
    return {};
  }
}

function saveCart() {
  localStorage.setItem("jolieLabCart", JSON.stringify(state.cart));
}

function cartEntries() {
  return Object.entries(state.cart)
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

function renderFilters() {
  filterWrap.innerHTML = categories
    .map(
      (category) => `
        <button class="${category === state.filter ? "is-active" : ""}" type="button" data-filter="${category}">
          ${category}
        </button>
      `,
    )
    .join("");
}

function renderProducts() {
  const query = state.search.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    const matchesFilter = state.filter === "Tous" || product.category === state.filter;
    const searchable = [product.name, product.category, product.description, ...productBenefits(product)].join(" ").toLowerCase();
    return matchesFilter && searchable.includes(query);
  });

  productGrid.innerHTML = visibleProducts
    .map(
      (product) => `
        <article class="product-card" itemscope itemtype="https://schema.org/Product">
          <meta itemprop="sku" content="JLB-${String(product.id).padStart(3, "0")}" />
          <a class="product-media" href="${product.pageUrl}" aria-label="Voir la page produit ${product.name}">
            <img src="${productImage(product.images[0])}" alt="${product.name}" loading="lazy" itemprop="image" />
            <span class="product-badge">${product.category}</span>
          </a>
          <div class="product-body">
            <h3 itemprop="name">${product.name}</h3>
            <p itemprop="description">${product.summary || product.description}</p>
            <div class="price-row" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
              <meta itemprop="priceCurrency" content="XOF" />
              <meta itemprop="price" content="${product.price}" />
              <link itemprop="availability" href="https://schema.org/InStock" />
              <strong>${productPriceLabel(product)}</strong>
            </div>
            ${variantSelectMarkup(product, "card")}
            <div class="card-actions">
              <button class="button button-primary" type="button" data-add="${product.id}">Ajouter</button>
              <a class="quick-view" href="${product.pageUrl}" aria-label="Ouvrir la page produit">Détails</a>
            </div>
          </div>
        </article>
      `,
    )
    .join("");

  if (!visibleProducts.length) {
    productGrid.innerHTML = `<p class="empty-cart">Aucun produit ne correspond à cette recherche.</p>`;
  }
}

function renderCart() {
  const entries = cartEntries();
  cartCount.textContent = cartQuantity();
  cartTotal.textContent = formatPrice(cartAmount());

  if (!entries.length) {
    cartItems.innerHTML = `<div class="empty-cart">Votre panier est vide.</div>`;
  } else {
    cartItems.innerHTML = entries
      .map(
        ({ key, product, variant, quantity }) => `
          <article class="cart-item">
            <img src="${productImage(product.images[0])}" alt="${lineName(product, variant)}" />
            <div>
              <h3>${lineName(product, variant)}</h3>
              <p>${formatPrice(linePrice(product, variant))}</p>
              <div class="qty-row">
                <button type="button" data-decrease="${key}" aria-label="Retirer une unité">-</button>
                <strong>${quantity}</strong>
                <button type="button" data-increase="${key}" aria-label="Ajouter une unité">+</button>
                <button type="button" data-remove="${key}">Retirer</button>
              </div>
            </div>
          </article>
        `,
      )
      .join("");
  }

  if (checkoutLink) {
    checkoutLink.classList.toggle("is-disabled", entries.length === 0);
    checkoutLink.setAttribute("aria-disabled", entries.length === 0 ? "true" : "false");
  }
  saveCart();
}

function buildWhatsAppUrl() {
  const data = new FormData(orderForm);
  const entries = cartEntries();
  const lines = [
    "Bonjour Jolie Lab Beauty, je souhaite commander :",
    "",
    ...entries.map(({ product, variant, quantity }) => `- ${quantity} x ${lineName(product, variant)} (${formatPrice(linePrice(product, variant))})`),
    "",
    `Total produits : ${formatPrice(cartAmount())}`,
    `Nom : ${data.get("customerName") || ""}`,
    `Téléphone : ${data.get("customerPhone") || ""}`,
    `Livraison : ${data.get("deliveryZone") || ""}`,
    `Paiement : ${data.get("paymentMethod") || ""}`,
    `Adresse : ${data.get("address") || ""}`,
  ];

  return `https://wa.me/${CONTACT.phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function renderProductStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Catalogue Jolie Lab Beauty",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        sku: `JLB-${String(product.id).padStart(3, "0")}`,
        category: product.category,
        image: product.images.map((image) => productImage(image)),
        description: product.description,
        brand: {
          "@type": "Brand",
          name: "Jolie Lab Beauty",
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "XOF",
          price: product.price,
          availability: "https://schema.org/InStock",
        },
      },
    })),
  };

  const node = document.createElement("script");
  node.type = "application/ld+json";
  node.textContent = JSON.stringify(structuredData);
  document.head.appendChild(node);
}

function addToCart(id, variantId = "") {
  const product = products.find((item) => item.id === Number(id));
  if (!product) return { ok: false, message: "Produit introuvable." };
  if (product.variants?.length && !variantId) {
    return { ok: false, message: "Choisissez Petit complet ou Grand complet avant d'ajouter ce produit." };
  }
  const variant = variantId ? productVariant(product, variantId) : defaultVariant(product);
  if (product.variants?.length && !variant) {
    return { ok: false, message: "Format indisponible. Choisissez un autre format." };
  }
  const key = cartKey(product.id, variant?.id);
  state.cart[key] = (state.cart[key] || 0) + 1;
  renderCart();
  return { ok: true, product, variant };
}

function changeQuantity(key, delta) {
  const next = (state.cart[key] || 0) + delta;
  if (next <= 0) {
    delete state.cart[key];
  } else {
    state.cart[key] = next;
  }
  renderCart();
}

function openCart() {
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
}

function openModal(id) {
  const product = products.find((item) => item.id === Number(id));
  if (!product) return;

  state.modalProduct = product;
  modalTitle.textContent = product.name;
  modalDescription.textContent = product.description;
  modalCategory.textContent = product.category;
  modalPrice.textContent = productPriceLabel(product);
  if (modalVariant) {
    modalVariant.innerHTML = variantSelectMarkup(product, "modal");
    modalVariant.hidden = !product.variants?.length;
  }
  modalSku.textContent = `Réf. JLB-${String(product.id).padStart(3, "0")}`;
  modalSuited.textContent = getSuitedFor(product);
  modalUsage.textContent = getUsageAdvice(product);
  modalWhatsApp.href = getProductWhatsAppUrl(product);
  modalBenefits.innerHTML = productBenefits(product).map((benefit) => `<li>${benefit}</li>`).join("");
  const related = products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 3);
  modalRelated.innerHTML = related.length
    ? `
      <h3>Produits similaires</h3>
      <div class="related-list">
        ${related
          .map(
            (item) => `
              <button type="button" data-view="${item.id}">
                <img src="${productImage(item.images[0])}" alt="${item.name}" />
                <span>${item.name}</span>
              </button>
            `,
          )
          .join("")}
      </div>
    `
    : "";
  setModalImage(product.images[0]);
  modalThumbs.innerHTML = product.images
    .map(
      (image, index) => `
        <button class="${index === 0 ? "is-active" : ""}" type="button" data-thumb="${image}" aria-label="Image ${index + 1}">
          <img src="${productImage(image)}" alt="${product.name}" />
        </button>
      `,
    )
    .join("");
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  history.replaceState(null, "", `#produit-${product.id}-${productSlug(product)}`);
}

function setModalImage(image) {
  if (!state.modalProduct) return;
  modalImage.src = productImage(image);
  modalImage.alt = state.modalProduct.name;
  modalThumbs.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.thumb === image);
  });
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  if (location.hash.startsWith("#produit-")) {
    history.replaceState(null, "", `${location.href.split("#")[0]}#boutique`);
  }
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  const viewButton = event.target.closest("[data-view]");
  const filterButton = event.target.closest("[data-filter]");
  const increaseButton = event.target.closest("[data-increase]");
  const decreaseButton = event.target.closest("[data-decrease]");
  const removeButton = event.target.closest("[data-remove]");
  const thumbButton = event.target.closest("[data-thumb]");

  if (addButton) {
    const addScope = addButton.closest(".product-body") || document;
    const result = addToCart(addButton.dataset.add, selectedVariantId(addButton.dataset.add, addScope));
    if (!result.ok) {
      const select = addScope.querySelector(`[data-variant-select="${addButton.dataset.add}"]`);
      select?.reportValidity();
      select?.focus();
      return;
    }
    openCart();
  }

  if (viewButton) {
    openModal(viewButton.dataset.view);
  }

  if (filterButton) {
    state.filter = filterButton.dataset.filter;
    renderFilters();
    renderProducts();
  }

  if (increaseButton) changeQuantity(increaseButton.dataset.increase, 1);
  if (decreaseButton) changeQuantity(decreaseButton.dataset.decrease, -1);
  if (removeButton) {
    delete state.cart[removeButton.dataset.remove];
    renderCart();
  }

  if (thumbButton) setModalImage(thumbButton.dataset.thumb);

  if (event.target.closest("[data-cart-open]")) openCart();
  if (event.target.closest("[data-cart-close]") || event.target === cartDrawer) closeCart();
  if (event.target.closest("[data-modal-close]") || event.target === modal) closeModal();
  if (event.target.matches("[data-cart-clear]")) {
    state.cart = {};
    renderCart();
  }
  if (event.target.closest("[data-menu-toggle]")) nav.classList.toggle("is-open");
});

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderProducts();
});

if (orderForm) {
  orderForm.addEventListener("input", () => {});
}

modalAdd.addEventListener("click", () => {
  if (!state.modalProduct) return;
  const result = addToCart(state.modalProduct.id, selectedVariantId(state.modalProduct.id, modalVariant || document));
  if (!result.ok) {
    const select = modalVariant?.querySelector(`[data-variant-select="${state.modalProduct.id}"]`);
    select?.reportValidity();
    select?.focus();
    return;
  }
  closeModal();
  openCart();
});

window.addEventListener("scroll", () => {
  header.classList.toggle("is-scrolled", window.scrollY > 40);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeCart();
  closeModal();
});

renderFilters();
renderProducts();
renderCart();
renderProductStructuredData();

if (location.hash.startsWith("#produit-")) {
  const productId = Number(location.hash.match(/^#produit-(\d+)/)?.[1]);
  if (productId) openModal(productId);
}
