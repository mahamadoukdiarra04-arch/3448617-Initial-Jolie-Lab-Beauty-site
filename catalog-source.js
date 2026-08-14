(function () {
  const ADMIN_PRODUCTS_ENDPOINT = "api/products/list.php";

  const SANITY_PRODUCTS_QUERY = `*[_type == "product" && coalesce(isActive, true)] | order(coalesce(sortOrder, 9999) asc, name asc) {
    _id,
    productId,
    name,
    "slug": slug.current,
    category,
    price,
    priceNote,
    description,
    summary,
    usage,
    suitedFor,
    "images": images[]{"url": asset->url, alt},
    "videos": videos[]{"url": asset->url, title, alt, "mimeType": asset->mimeType, "originalFilename": asset->originalFilename},
    variants[]{id, name, price}
  }`;

  function hasSanityConfig() {
    const config = window.JOLIE_SANITY || {};
    return Boolean(config.projectId && config.dataset && config.apiVersion);
  }

  function isLocalDevelopmentHost() {
    const host = window.location.hostname;
    return !host || host === "localhost" || host === "127.0.0.1" || host === "::1";
  }

  function normalizeImage(image) {
    if (!image) return null;
    if (typeof image === "string") return image;
    return image.url || image.asset?.url || null;
  }

  function normalizeVideo(video) {
    if (!video) return null;
    if (typeof video === "string") return {url: video};
    const url = video.url || video.asset?.url;
    if (!url) return null;
    return {
      url,
      title: video.title || video.alt || video.originalFilename || "",
      alt: video.alt || video.title || "",
      mimeType: video.mimeType || "",
    };
  }

  function normalizeProduct(product, index) {
    const images = (product.images || []).map(normalizeImage).filter(Boolean);
    const videos = (product.videos || []).map(normalizeVideo).filter(Boolean);
    const id = product.productId || product.id || product._id || index + 1;
    const name = product.name || `Produit ${index + 1}`;
    const slug = product.slug || slugify(name);
    return {
      id,
      name,
      slug,
      category: product.category || "Beauté",
      price: Number(product.price) || 0,
      priceNote: product.priceNote || null,
      images,
      videos,
      description: product.description || name,
      summary: product.summary || summaryFromDescription(product.description || name),
      usage: product.usage || "",
      suitedFor: product.suitedFor || "",
      sortOrder: Number(product.sortOrder) || index + 1,
      variants: Array.isArray(product.variants)
        ? product.variants
            .filter((variant) => variant?.name && Number(variant?.price) > 0)
            .map((variant) => ({
              id: variant.id || slugify(variant.name),
              name: variant.name,
              price: Number(variant.price),
            }))
        : undefined,
      pageUrl: `produit.html?slug=${encodeURIComponent(slug)}&id=${encodeURIComponent(id)}`,
    };
  }

  function slugify(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function summaryFromDescription(description) {
    const text = String(description || "")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !/\d[\d\s]*(?:fcfa|f)\b/i.test(line))
      .join(" ");
    return text.length > 150 ? `${text.slice(0, 147).trim()}...` : text;
  }

  async function fetchSanityProducts() {
    const config = window.JOLIE_SANITY || {};
    const host = config.useCdn === false ? "api" : "apicdn";
    const query = encodeURIComponent(SANITY_PRODUCTS_QUERY);
    const url = `https://${config.projectId}.${host}.sanity.io/v${config.apiVersion}/data/query/${config.dataset}?query=${query}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Sanity returned ${response.status}`);
    const payload = await response.json();
    return Array.isArray(payload.result) ? payload.result : [];
  }

  function canUseAdminProducts() {
    return window.location.protocol === "http:" || window.location.protocol === "https:";
  }

  async function fetchAdminProducts() {
    const response = await fetch(ADMIN_PRODUCTS_ENDPOINT, { headers: { Accept: "application/json" } });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || `Admin catalogue returned ${response.status}`);
    }
    return {
      products: Array.isArray(payload.products) ? payload.products : [],
      hiddenProducts: Array.isArray(payload.hiddenProducts) ? payload.hiddenProducts : [],
    };
  }

  function productKeys(product) {
    return [product.id, product.productId, product._id, product.slug]
      .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
      .map((value) => String(value));
  }

  function mergeAdminProducts(baseProducts, adminProducts, hiddenProducts) {
    const hiddenKeys = new Set(hiddenProducts.flatMap(productKeys));
    const merged = [];
    const indexByKey = new Map();

    baseProducts.forEach((product) => {
      const keys = productKeys(product);
      if (keys.some((key) => hiddenKeys.has(key))) return;
      indexByKey.set(String(product.id), merged.length);
      if (product.slug) indexByKey.set(String(product.slug), merged.length);
      merged.push(product);
    });

    adminProducts
      .slice()
      .sort((first, second) => (Number(first.sortOrder) || 9999) - (Number(second.sortOrder) || 9999))
      .forEach((product) => {
        const keys = productKeys(product);
        if (keys.some((key) => hiddenKeys.has(key))) return;
        const existingIndex = keys.map((key) => indexByKey.get(key)).find((index) => index !== undefined);

        if (existingIndex !== undefined) {
          merged[existingIndex] = product;
          keys.forEach((key) => indexByKey.set(key, existingIndex));
          return;
        }

        keys.forEach((key) => indexByKey.set(key, merged.length));
        merged.push(product);
      });

    return merged;
  }

  async function loadBaseProducts(fallback) {
    if (isLocalDevelopmentHost()) return fallback;
    if (!hasSanityConfig()) return fallback;
    try {
      const products = await fetchSanityProducts();
      const normalized = products.map(normalizeProduct).filter((product) => product.name && product.images.length);
      return normalized.length ? normalized : fallback;
    } catch (error) {
      console.warn("Sanity products unavailable, using local catalogue.", error);
      return fallback;
    }
  }

  async function loadProducts(fallbackProducts = window.JOLIE_PRODUCTS || []) {
    const fallback = (fallbackProducts || []).map(normalizeProduct);

    if (canUseAdminProducts()) {
      try {
        const adminPayload = await fetchAdminProducts();
        const normalizedAdminProducts = adminPayload.products.map(normalizeProduct).filter((product) => product.name);
        const normalizedHiddenProducts = adminPayload.hiddenProducts.map((product) => ({
          id: product.id || product.productId || product._id || "",
          slug: product.slug || "",
        }));
        if (normalizedAdminProducts.length || normalizedHiddenProducts.length) {
          return normalizedAdminProducts
            .slice()
            .sort((first, second) => (Number(first.sortOrder) || 9999) - (Number(second.sortOrder) || 9999));
        }
      } catch (error) {
        console.warn("Admin products unavailable, using catalogue fallback.", error);
      }
    }

    return loadBaseProducts(fallback);
  }

  window.JolieCatalog = {
    loadProducts,
    slugify,
  };
})();
