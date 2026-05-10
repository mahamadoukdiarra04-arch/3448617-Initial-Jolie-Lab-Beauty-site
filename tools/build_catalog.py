from __future__ import annotations

import html
import json
import re
import shutil
import unicodedata
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
SITE = Path(__file__).resolve().parents[1]
SOURCE_PRODUCTS = ROOT / "Produits"
SOURCE_BRAND = ROOT / "Logo & header site"
ASSETS = SITE / "assets"
PRODUCT_ASSETS = ASSETS / "products"
BRAND_ASSETS = ASSETS / "brand"
DATA_DIR = SITE / "data"
PAGES_DIR = SITE / "produits"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

NAMES = {
    1: "Sérum Anti-Acné Intensif",
    2: "Masque Stick au Thé Vert Purifiant",
    3: "Spray Solaire SPF50+ Hydratant",
    4: "Gel Anti-Acné à l'Acide Salicylique",
    5: "Pack Éclaircissant Kojic Acid",
    6: "Castor-NF Anti-Imperfections",
    7: "Pack Éclat & Réparation AHA + Bio-Oil",
    8: "Soin Anti-Rides Contour des Yeux",
    9: "Pack Visage Vitamine C SADOER",
    10: "Sérum Éclaircissant Articulations",
    11: "Crème Noor Gold No Marks",
    12: "Pack Jhalak Éclaircissant Visage",
    13: "Gel Nettoyant au Caviar Doré",
    14: "Mousse Nettoyante SADOER Hyaluronique",
    15: "Lingettes Démaquillantes & Nettoyantes",
    16: "Gants Exfoliants Doux",
    17: "Éponges de Maquillage Douces",
    18: "Complet Luxe Hair",
    19: "Kit Repousse Barbe & Anti-Calvitie",
    20: "Fonds de teint zéro défaut",
    21: "Routine Visage Éclat 4 Produits",
    22: "Masques Visage Curcuma & Feuilles",
    23: "Boîte à Bijoux & Maquillage avec Miroir",
    24: "Boîte de Rangement Makeup Chic",
    25: "Huile de Massage DR. MINOW",
    26: "Gamme Advanced Korean Skin",
    27: "Gels Douche Exfoliants Fruités",
    28: "Gels Douche BERG Glow",
}

CATEGORIES = {
    1: "Visage",
    2: "Visage",
    3: "Visage",
    4: "Visage",
    5: "Packs",
    6: "Corps",
    7: "Packs",
    8: "Visage",
    9: "Packs",
    10: "Corps",
    11: "Visage",
    12: "Packs",
    13: "Visage",
    14: "Visage",
    15: "Accessoires",
    16: "Accessoires",
    17: "Accessoires",
    18: "Cheveux",
    19: "Homme",
    20: "Maquillage",
    21: "Packs",
    22: "Visage",
    23: "Accessoires",
    24: "Accessoires",
    25: "Corps",
    26: "Corps",
    27: "Corps",
    28: "Corps",
}

VARIANTS = {
    18: [
        {"id": "petit", "name": "Petit complet", "price": 13000},
        {"id": "grand", "name": "Grand complet", "price": 17000},
    ],
}


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value)
    without_accents = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", without_accents.lower()).strip("-")
    return slug or "produit"


def read_description(path: Path) -> str:
    text = path.read_text(encoding="utf-8-sig")
    return text.replace("\r\n", "\n").replace("\r", "\n").strip()


def price_from_description(description: str) -> tuple[int, str | None]:
    price_lines = [line.strip() for line in description.splitlines() if re.search(r"\d[\d\s]*(?:fcfa|f)\b", line, re.I)]
    matches = re.findall(r"(\d[\d\s]*)\s*(?:fcfa|f)\b", "\n".join(price_lines), flags=re.I)
    prices = [int(re.sub(r"\s+", "", match)) for match in matches]
    price = prices[0] if prices else 0
    price_note = None
    if len(prices) > 1 or (price_lines and not re.search(r"^prix\s*:?\s*\d[\d\s]*(?:fcfa|f)\s*$", price_lines[-1], re.I)):
        price_note = price_lines[-1]
    return price, price_note


def summary_from_description(description: str, product_name: str) -> str:
    ignored = {"titre", "description", "bienfaits", "conseils d’utilisation", "conseils d'utilisation"}
    lines = []
    for line in description.splitlines():
        clean = line.strip()
        if not clean:
            continue
        normalized = clean.rstrip(":").lower()
        if normalized in ignored or re.search(r"\d[\d\s]*(?:fcfa|f)\b", clean, re.I):
            continue
        if clean == product_name:
            continue
        lines.append(clean)
    summary = " ".join(lines)
    if len(summary) > 150:
        summary = summary[:147].rstrip() + "..."
    return summary or product_name


def format_price(price: int) -> str:
    return f"{price:,}".replace(",", " ") + " FCFA"


def price_label_for_product(product: dict) -> str:
    if product.get("variants"):
        return " • ".join(f"{variant['name']} {format_price(variant['price'])}" for variant in product["variants"])
    return product["priceNote"] or format_price(product["price"])


def copy_product_images(product_number: int, product_dir: Path) -> list[str]:
    images = []
    files = sorted(
        [file for file in product_dir.iterdir() if file.is_file() and file.suffix.lower() in IMAGE_EXTENSIONS],
        key=lambda file: file.name.lower(),
    )
    for index, file in enumerate(files, start=1):
        ext = file.suffix.lower()
        target_name = f"product-{product_number:02d}-{index:02d}{ext}"
        target = PRODUCT_ASSETS / target_name
        shutil.copy2(file, target)
        images.append(f"assets/products/{target_name}")
    return images


def crop_logo() -> str | None:
    logo_dir = SOURCE_BRAND / "LOGO"
    if not logo_dir.exists():
        return None
    files = sorted([file for file in logo_dir.iterdir() if file.suffix.lower() in IMAGE_EXTENSIONS])
    if not files:
        return None

    source = files[0]
    image = Image.open(source).convert("RGB")
    pixels = image.load()
    xs, ys = [], []
    width, height = image.size
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            if r < 70 and g < 70 and b < 70:
                xs.append(x)
                ys.append(y)
    if xs and ys:
        padding = 28
        left = max(min(xs) - padding, 0)
        top = max(min(ys) - padding, 0)
        right = min(max(xs) + padding, width)
        bottom = min(max(ys) + padding, height)
        image = image.crop((left, top, right, bottom))
    target = BRAND_ASSETS / "logo.png"
    image.save(target)
    favicon = image.copy()
    favicon.thumbnail((64, 64), Image.Resampling.LANCZOS)
    favicon.save(SITE / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    shutil.copy2(source, BRAND_ASSETS / "logo-original.jpeg")
    return "assets/brand/logo.png"


def copy_hero_images() -> list[str]:
    hero_dir = SOURCE_BRAND / "HERO"
    if not hero_dir.exists():
        return []
    heroes = []
    files = sorted([file for file in hero_dir.iterdir() if file.suffix.lower() in IMAGE_EXTENSIONS], key=lambda file: file.name.lower())
    for index, file in enumerate(files, start=1):
        target_name = f"hero-{index:02d}{file.suffix.lower()}"
        shutil.copy2(file, BRAND_ASSETS / target_name)
        heroes.append(f"assets/brand/{target_name}")
    return heroes


def product_usage(product: dict) -> str:
    name = product["name"].lower()
    category = product["category"]
    if "solaire" in name:
        return "Appliquer avant l'exposition au soleil et renouveler régulièrement. Éviter le contact direct avec les yeux."
    if "masque" in name:
        return "Appliquer sur peau propre, laisser poser selon la tolérance de la peau, puis rincer. Commencer doucement si la peau est sensible."
    if "gants" in name:
        return "Utiliser sous la douche avec savon ou gel douche, puis hydrater la peau. Ne pas frotter trop fort sur peau irritée."
    if "éponges" in name:
        return "Utiliser sèche ou humide selon le fini souhaité, puis laver et laisser sécher après usage."
    if "lingettes" in name:
        return "Utiliser pour retirer maquillage ou impuretés, puis compléter avec un soin adapté si besoin."
    if category == "Maquillage":
        return "Appliquer en fine couche et estomper progressivement. Choisir la teinte avec soin avant validation de la commande."
    if category in {"Cheveux", "Homme"}:
        return "Appliquer régulièrement selon la routine choisie. Demander confirmation sur WhatsApp pour la fréquence conseillée."
    if category == "Packs":
        return "Utiliser les produits du pack dans l'ordre conseillé au moment de la commande. Faire un test sur une petite zone si la peau est sensible."
    if category == "Visage":
        return "Appliquer sur peau propre et commencer progressivement. Éviter le contour des yeux et demander conseil en cas de peau sensible."
    return "Utiliser selon le besoin ciblé et confirmer la routine complète sur WhatsApp avant commande."


def suited_for(product: dict) -> str:
    name = product["name"].lower()
    category = product["category"]
    if "solaire" in name:
        return "Les clientes qui veulent protéger leur peau au quotidien, surtout pendant une routine éclat ou anti-taches."
    if "acné" in name or "imperfection" in name:
        return "Les peaux sujettes aux boutons, marques visibles, excès de sébum ou texture irrégulière."
    if category == "Maquillage":
        return "Les clientes qui recherchent un teint plus uniforme, travaillé et longue tenue."
    if category == "Cheveux":
        return "Les routines capillaires qui ciblent la casse, la chute, la pousse ou le manque de volume."
    if category == "Homme":
        return "Les hommes qui souhaitent entretenir la barbe, le cuir chevelu ou les zones clairsemées."
    if category == "Accessoires":
        return "Les routines beauté quotidiennes qui ont besoin d'un accessoire pratique, simple et facile à nettoyer."
    if category == "Packs":
        return "Les clientes qui préfèrent une routine complète avec plusieurs produits complémentaires."
    if category == "Corps":
        return "Les soins corps orientés douceur, confort, éclat et aspect plus uniforme de la peau."
    return "Les routines visage qui recherchent un soin ciblé, facile à intégrer au quotidien."


def build_products() -> list[dict]:
    products = []
    for product_dir in sorted([path for path in SOURCE_PRODUCTS.iterdir() if path.is_dir()], key=lambda path: int(path.name)):
        number = int(product_dir.name)
        description = read_description(product_dir / "Description.txt")
        price, price_note = price_from_description(description)
        name = NAMES.get(number, summary_from_description(description, f"Produit {number}"))
        slug = f"{number:02d}-{slugify(name)}"
        product = {
            "id": number,
            "name": name,
            "slug": slug,
            "category": CATEGORIES.get(number, "Beauté"),
            "price": price,
            "priceNote": price_note,
            "images": copy_product_images(number, product_dir),
            "description": description,
            "summary": summary_from_description(description, name),
            "pageUrl": f"produits/{slug}.html",
        }
        if number in VARIANTS:
            product["variants"] = VARIANTS[number]
            product["price"] = product["variants"][0]["price"]
            product["priceNote"] = price_label_for_product(product)
        product["usage"] = product_usage(product)
        product["suitedFor"] = suited_for(product)
        products.append(product)
    return products


def html_description(description: str) -> str:
    return html.escape(description)


def product_json_ld(product: dict) -> str:
    data = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product["name"],
        "sku": f"JLB-{product['id']:03d}",
        "category": product["category"],
        "image": [f"../{image}" for image in product["images"]],
        "description": product["description"],
        "brand": {"@type": "Brand", "name": "Jolie Lab Beauty"},
        "offers": {
            "@type": "Offer",
            "priceCurrency": "XOF",
            "price": product["price"],
            "availability": "https://schema.org/InStock",
        },
    }
    return json.dumps(data, ensure_ascii=False).replace("</", "<\\/")


def render_related(product: dict, products: list[dict]) -> str:
    related = [item for item in products if item["id"] != product["id"] and item["category"] == product["category"]]
    if len(related) < 3:
        related += [item for item in products if item["id"] != product["id"] and item not in related][: 3 - len(related)]
    related = related[:3]
    cards = []
    for item in related:
        cards.append(
            f"""
            <a class="related-card" href="../{html.escape(item['pageUrl'])}">
              <img src="../{html.escape(item['images'][0])}" alt="{html.escape(item['name'])}" />
              <span>{html.escape(item['name'])}</span>
            </a>
            """
        )
    return "\n".join(cards)


def render_variant_selector(product: dict, prefix: str) -> str:
    if not product.get("variants"):
        return ""
    field_id = f"{prefix}-variant-{product['id']}"
    options = "\n".join(
        f'<option value="{html.escape(variant["id"])}">{html.escape(variant["name"])} - {format_price(variant["price"])}</option>'
        for variant in product["variants"]
    )
    return f"""
          <label class="variant-field" for="{html.escape(field_id)}">
            <span>Choisir le format</span>
            <select id="{html.escape(field_id)}" data-variant-select="{product['id']}" required>
              <option value="">Sélectionner un format</option>
              {options}
            </select>
          </label>
"""


def render_page(product: dict, products: list[dict], logo_path: str | None) -> str:
    hero_image = product["images"][0]
    other_images = product["images"][1:]
    thumbs = "\n".join(
        f'<button type="button" data-gallery-thumb="../{html.escape(image)}"><img src="../{html.escape(image)}" alt="{html.escape(product["name"])}" /></button>'
        for image in product["images"]
    )
    secondary_gallery = "\n".join(
        f'<img src="../{html.escape(image)}" alt="{html.escape(product["name"])}" />'
        for image in other_images[:3]
    )
    price_label = price_label_for_product(product)
    variant_selector = render_variant_selector(product, "product")
    logo_markup = (
        f'<img class="brand-logo" src="../{html.escape(logo_path)}" alt="" />'
        if logo_path
        else '<span class="brand-logo-fallback">JL</span>'
    )
    whatsapp_text = f"Bonjour Jolie Lab Beauty, je souhaite commander : {product['name']} ({price_label})."
    whatsapp_url = "https://wa.me/22394307799?text=" + html.escape(__import__("urllib.parse").parse.quote(whatsapp_text))
    return f"""<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{html.escape(product['name'])} | Jolie Lab Beauty</title>
    <meta name="description" content="{html.escape(product['summary'])}" />
    <meta property="og:title" content="{html.escape(product['name'])} | Jolie Lab Beauty" />
    <meta property="og:description" content="{html.escape(product['summary'])}" />
    <meta property="og:type" content="product" />
    <meta property="og:image" content="../{html.escape(hero_image)}" />
    <meta name="theme-color" content="#15120f" />
    <link rel="icon" type="image/png" href="../assets/brand/logo.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="../styles.css" />
    <script type="application/ld+json">{product_json_ld(product)}</script>
  </head>
  <body class="product-page" data-product-id="{product['id']}">
    <header class="product-page-header">
      <a class="brand" href="../index.html#accueil" aria-label="Jolie Lab Beauty accueil">
        <span class="brand-mark">{logo_markup}</span>
        <span><strong>Jolie Lab</strong><small>Beauty</small></span>
      </a>
      <nav class="product-page-nav">
        <a href="../index.html#boutique">Boutique</a>
        <a href="../index.html#livraison">Livraison</a>
        <a href="../index.html#contact">Contact</a>
      </nav>
      <a class="cart-pill" href="../checkout.html"><span>Panier</span><strong data-cart-count>0</strong></a>
    </header>

    <main class="product-main">
      <nav class="breadcrumb" aria-label="Fil d'Ariane">
        <a href="../index.html#boutique">Boutique</a>
        <span>/</span>
        <span>{html.escape(product['category'])}</span>
      </nav>

      <section class="product-detail-layout">
        <div class="product-detail-gallery">
          <img class="product-detail-main-image" src="../{html.escape(hero_image)}" alt="{html.escape(product['name'])}" data-gallery-main />
          <div class="product-detail-thumbs">{thumbs}</div>
          <div class="product-detail-secondary">{secondary_gallery}</div>
        </div>

        <article class="product-detail-content">
          <p class="mini-label">{html.escape(product['category'])}</p>
          <h1>{html.escape(product['name'])}</h1>
          <div class="product-meta-row">
            <span>Réf. JLB-{product['id']:03d}</span>
            <span>Disponibilité à confirmer</span>
            <span>{html.escape(product['category'])}</span>
          </div>
          <div class="product-price">{html.escape(price_label)}</div>
{variant_selector}

          <div class="product-action-row">
            <button class="button button-primary" type="button" data-product-add>Ajouter au panier</button>
            <a class="button button-soft" href="{whatsapp_url}" target="_blank" rel="noreferrer">Commander sur WhatsApp</a>
          </div>
          <p class="product-feedback" data-product-feedback aria-live="polite"></p>

          <section class="product-description-block">
            <h2>Description originale</h2>
            <pre class="raw-description">{html_description(product['description'])}</pre>
          </section>

          <section class="product-info-panels">
            <article>
              <h2>Idéal pour</h2>
              <p>{html.escape(product['suitedFor'])}</p>
            </article>
            <article>
              <h2>Conseil d'utilisation</h2>
              <p>{html.escape(product['usage'])}</p>
            </article>
            <article>
              <h2>Livraison & paiement</h2>
              <p>Livraison à Bamako et à l'international. Paiement à la livraison, Orange Money, Moov Money ou Wave.</p>
            </article>
          </section>
        </article>
      </section>

      <section class="product-related-section">
        <div class="section-heading">
          <span class="mini-label">À découvrir</span>
          <div>
            <h2>Produits similaires</h2>
            <p>Complétez la routine avec une sélection proche du catalogue Jolie Lab Beauty.</p>
          </div>
        </div>
        <div class="product-related-grid">{render_related(product, products)}</div>
      </section>
    </main>

    <a class="floating-whatsapp" href="https://wa.me/22394307799" target="_blank" rel="noreferrer" aria-label="Contacter Jolie Lab Beauty sur WhatsApp">WhatsApp</a>
    <script src="../data/products.js"></script>
    <script src="../product-page.js"></script>
  </body>
</html>
"""


def write_data(products: list[dict], logo_path: str | None, heroes: list[str]) -> None:
    payload = json.dumps(products, ensure_ascii=False, indent=2)
    brand = json.dumps({"logo": logo_path, "heroes": heroes}, ensure_ascii=False, indent=2)
    (DATA_DIR / "products.js").write_text(
        f"window.JOLIE_PRODUCTS = {payload};\nwindow.JOLIE_BRAND = {brand};\n",
        encoding="utf-8",
    )


def main() -> None:
    PRODUCT_ASSETS.mkdir(parents=True, exist_ok=True)
    BRAND_ASSETS.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PAGES_DIR.mkdir(parents=True, exist_ok=True)

    logo_path = crop_logo()
    heroes = copy_hero_images()
    products = build_products()
    write_data(products, logo_path, heroes)

    for old_page in PAGES_DIR.glob("*.html"):
        old_page.unlink()
    for product in products:
        (PAGES_DIR / f"{product['slug']}.html").write_text(render_page(product, products, logo_path), encoding="utf-8")

    print(f"Generated {len(products)} products, {len(heroes)} hero images, logo={bool(logo_path)}")


if __name__ == "__main__":
    main()
