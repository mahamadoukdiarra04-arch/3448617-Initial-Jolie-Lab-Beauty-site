import React, {useCallback, useEffect, useMemo, useState} from "react";
import {IntentLink} from "sanity/router";
import {useClient} from "sanity";

const PRODUCT_QUERY = `*[_type == "product" && !(_id in path("drafts.**"))] | order(coalesce(sortOrder, productId) asc, name asc){
  _id,
  name,
  category,
  price,
  priceNote,
  summary,
  isActive,
  sortOrder,
  "slug": slug.current,
  "imageUrl": images[0].asset->url,
  "imageAlt": coalesce(images[0].alt, name),
  variants[]{name, price}
}`;

const categories = ["Toutes", "Visage", "Corps", "Cheveux", "Packs", "Accessoires", "Maquillage", "Homme"];

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return "Prix à renseigner";
  return `${new Intl.NumberFormat("fr-FR").format(price)} FCFA`;
}

function productUrl(product) {
  if (!product.slug) return "https://jolielabbeauty.com/";
  return `https://jolielabbeauty.com/produits/${product.slug}.html`;
}

function ProductAdminTool() {
  const client = useClient({apiVersion: "2026-05-12"});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Toutes");
  const [savingId, setSavingId] = useState("");
  const [draftPrices, setDraftPrices] = useState({});
  const [notice, setNotice] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await client.fetch(PRODUCT_QUERY);
      setProducts(result);
      setDraftPrices(
        Object.fromEntries(result.map((product) => [product._id, String(product.price || "")])),
      );
    } catch (requestError) {
      setError("Impossible de charger les produits pour le moment.");
      console.error(requestError);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const subscription = client
      .listen('*[_type == "product"]', {}, {visibility: "query"})
      .subscribe(() => loadProducts());

    return () => subscription.unsubscribe();
  }, [client, loadProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "Toutes" || product.category === category;
      const matchesSearch =
        !normalizedSearch ||
        [product.name, product.category, product.summary]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));

      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  const activeCount = products.filter((product) => product.isActive !== false).length;

  async function savePrice(product) {
    const rawValue = draftPrices[product._id];
    const nextPrice = Number(rawValue);

    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      setNotice("Prix invalide.");
      return;
    }

    setSavingId(product._id);
    setNotice("");
    try {
      await client.patch(product._id).set({price: nextPrice}).commit();
      setProducts((current) =>
        current.map((item) => (item._id === product._id ? {...item, price: nextPrice} : item)),
      );
      setNotice(`Prix mis à jour pour ${product.name}.`);
    } catch (requestError) {
      setNotice("Le prix n'a pas pu être enregistré.");
      console.error(requestError);
    } finally {
      setSavingId("");
    }
  }

  async function toggleVisibility(product) {
    const nextValue = product.isActive === false;
    setSavingId(product._id);
    setNotice("");
    try {
      await client.patch(product._id).set({isActive: nextValue}).commit();
      setProducts((current) =>
        current.map((item) => (item._id === product._id ? {...item, isActive: nextValue} : item)),
      );
      setNotice(`${product.name} est maintenant ${nextValue ? "visible" : "masqué"}.`);
    } catch (requestError) {
      setNotice("La visibilité n'a pas pu être modifiée.");
      console.error(requestError);
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="jolie-admin">
      <style>{styles}</style>

      <header className="admin-hero">
        <div>
          <p className="admin-kicker">Jolie Lab Beauty</p>
          <h1>Boutique Admin</h1>
          <p className="admin-subtitle">
            Gestion visuelle du catalogue publié sur jolielabbeauty.com.
          </p>
        </div>
        <div className="hero-actions">
          <IntentLink className="primary-link" intent="create" params={{type: "product"}}>
            Nouveau produit
          </IntentLink>
          <button className="ghost-button" type="button" onClick={loadProducts}>
            Rafraîchir
          </button>
        </div>
      </header>

      <section className="admin-stats" aria-label="Statistiques catalogue">
        <div>
          <strong>{products.length}</strong>
          <span>produits</span>
        </div>
        <div>
          <strong>{activeCount}</strong>
          <span>visibles</span>
        </div>
        <div>
          <strong>{products.length - activeCount}</strong>
          <span>masqués</span>
        </div>
      </section>

      <section className="admin-toolbar" aria-label="Filtres produits">
        <label>
          <span>Rechercher</span>
          <input
            type="search"
            value={search}
            placeholder="Nom, catégorie, résumé..."
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          <span>Catégorie</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </section>

      {notice ? <p className="admin-notice">{notice}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {loading ? (
        <div className="admin-empty">Chargement du catalogue...</div>
      ) : (
        <section className="product-admin-grid" aria-label="Produits">
          {filteredProducts.map((product) => {
            const isSaving = savingId === product._id;
            const isVisible = product.isActive !== false;
            return (
              <article className="admin-product-card" key={product._id}>
                <div className="product-media">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.imageAlt || product.name} loading="lazy" />
                  ) : (
                    <span>Image</span>
                  )}
                  <span className={`status-pill ${isVisible ? "visible" : "hidden"}`}>
                    {isVisible ? "Visible" : "Masqué"}
                  </span>
                </div>
                <div className="product-body">
                  <div className="product-heading">
                    <span>{product.category || "Sans catégorie"}</span>
                    <h2>{product.name}</h2>
                  </div>
                  <p className="product-summary">{product.summary || "Aucun résumé court renseigné."}</p>
                  {product.variants?.length ? (
                    <div className="variant-list">
                      {product.variants.map((variant) => (
                        <span key={`${product._id}-${variant.name}`}>
                          {variant.name}: {formatPrice(variant.price)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <label className="price-editor">
                    <span>Prix principal</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={draftPrices[product._id] ?? ""}
                      onChange={(event) =>
                        setDraftPrices((current) => ({...current, [product._id]: event.target.value}))
                      }
                    />
                  </label>
                  <div className="product-price-row">
                    <strong>{formatPrice(product.price)}</strong>
                    {product.priceNote ? <span>{product.priceNote}</span> : null}
                  </div>
                  <div className="card-actions">
                    <button
                      className="small-button"
                      type="button"
                      disabled={isSaving}
                      onClick={() => savePrice(product)}
                    >
                      Enregistrer prix
                    </button>
                    <button
                      className="small-button"
                      type="button"
                      disabled={isSaving}
                      onClick={() => toggleVisibility(product)}
                    >
                      {isVisible ? "Masquer" : "Afficher"}
                    </button>
                    <IntentLink
                      className="small-link"
                      intent="edit"
                      params={{id: product._id, type: "product"}}
                    >
                      Modifier fiche
                    </IntentLink>
                    <a className="small-link subtle" href={productUrl(product)} target="_blank" rel="noreferrer">
                      Voir site
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {!loading && filteredProducts.length === 0 ? (
        <div className="admin-empty">Aucun produit ne correspond aux filtres.</div>
      ) : null}
    </div>
  );
}

const styles = `
.jolie-admin {
  min-height: 100%;
  background: #f7f4ef;
  color: #19150f;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  padding: 24px;
}

.admin-hero {
  align-items: flex-end;
  background: linear-gradient(135deg, #17130f, #3d2b18);
  border-radius: 8px;
  color: #fffaf3;
  display: flex;
  gap: 24px;
  justify-content: space-between;
  padding: 28px;
}

.admin-kicker,
.product-heading span {
  color: #bd8b32;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .04em;
  margin: 0 0 8px;
  text-transform: uppercase;
}

.admin-hero h1 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 42px;
  line-height: 1;
  margin: 0;
}

.admin-subtitle {
  color: rgba(255, 250, 243, .78);
  font-size: 15px;
  margin: 12px 0 0;
  max-width: 520px;
}

.hero-actions,
.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.primary-link,
.ghost-button,
.small-button,
.small-link {
  align-items: center;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  text-decoration: none;
}

.primary-link {
  background: #fff;
  color: #15110d;
}

.ghost-button {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, .38);
  color: #fff;
}

.admin-stats {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 18px 0;
}

.admin-stats div,
.admin-toolbar,
.admin-product-card,
.admin-empty,
.admin-notice,
.admin-error {
  background: #fffdf9;
  border: 1px solid rgba(25, 21, 15, .08);
  border-radius: 8px;
  box-shadow: 0 18px 48px rgba(49, 35, 20, .08);
}

.admin-stats div {
  padding: 18px;
}

.admin-stats strong {
  display: block;
  font-size: 28px;
}

.admin-stats span,
.admin-toolbar label span,
.price-editor span {
  color: #7a6f62;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.admin-toolbar {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr 220px;
  margin-bottom: 20px;
  padding: 16px;
}

.admin-toolbar label,
.price-editor {
  display: grid;
  gap: 8px;
}

.admin-toolbar input,
.admin-toolbar select,
.price-editor input {
  background: #fff;
  border: 1px solid rgba(25, 21, 15, .16);
  border-radius: 8px;
  color: #19150f;
  font: inherit;
  min-height: 42px;
  padding: 0 12px;
  width: 100%;
}

.product-admin-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.admin-product-card {
  overflow: hidden;
}

.product-media {
  aspect-ratio: 4 / 3;
  background: #efe9df;
  position: relative;
}

.product-media img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.product-media > span:not(.status-pill) {
  align-items: center;
  color: #8d8173;
  display: flex;
  height: 100%;
  justify-content: center;
}

.status-pill {
  backdrop-filter: blur(10px);
  border-radius: 999px;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  left: 12px;
  padding: 7px 10px;
  position: absolute;
  top: 12px;
}

.status-pill.visible {
  background: rgba(24, 132, 74, .88);
}

.status-pill.hidden {
  background: rgba(130, 44, 35, .88);
}

.product-body {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.product-heading h2 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 23px;
  line-height: 1.08;
  margin: 0;
}

.product-summary {
  color: #5f564e;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  min-height: 42px;
}

.variant-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.variant-list span {
  background: #f0ebe3;
  border-radius: 999px;
  color: #4d4237;
  font-size: 12px;
  font-weight: 700;
  padding: 7px 9px;
}

.product-price-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
}

.product-price-row strong {
  font-size: 20px;
}

.product-price-row span {
  color: #7a6f62;
  font-size: 13px;
}

.small-button,
.small-link {
  background: #19150f;
  border: 1px solid #19150f;
  color: #fff;
  flex: 1 1 130px;
}

.small-button:disabled {
  cursor: wait;
  opacity: .52;
}

.small-link.subtle {
  background: #fff;
  color: #19150f;
}

.admin-empty,
.admin-notice,
.admin-error {
  margin-top: 18px;
  padding: 18px;
}

.admin-notice {
  border-color: rgba(24, 132, 74, .25);
  color: #16623d;
}

.admin-error {
  border-color: rgba(130, 44, 35, .25);
  color: #822c23;
}

@media (max-width: 720px) {
  .jolie-admin {
    padding: 12px;
  }

  .admin-hero {
    align-items: stretch;
    flex-direction: column;
    padding: 20px;
  }

  .admin-hero h1 {
    font-size: 34px;
  }

  .admin-stats,
  .admin-toolbar {
    grid-template-columns: 1fr;
  }
}
`;

export default ProductAdminTool;
