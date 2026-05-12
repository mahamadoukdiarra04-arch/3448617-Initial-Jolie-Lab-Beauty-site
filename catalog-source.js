(function () {
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
    variants[]{id, name, price}
  }`;

  function hasSanityConfig() {
    const config = window.JOLIE_SANITY || {};
    return Boolean(config.projectId && config.dataset && config.apiVersion);
  }

  function normalizeImage(image) {
    if (!image) return null;
    if (typeof image === "string") return image;
    return image.url || image.asset?.url || null;
  }

  function normalizeProduct(product, index) {
    const images = (product.images || []).map(normalizeImage).filter(Boolean);
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
      description: product.description || name,
      summary: product.summary || summaryFromDescription(product.description || name),
      usage: product.usage || "",
      suitedFor: product.suitedFor || "",
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

  async function loadProducts(fallbackProducts = window.JOLIE_PRODUCTS || []) {
    const fallback = (fallbackProducts || []).map(normalizeProduct);
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

  window.JolieCatalog = {
    loadProducts,
    slugify,
  };
})();
