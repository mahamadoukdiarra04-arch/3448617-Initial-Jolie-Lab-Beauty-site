import {createReadStream} from "node:fs";
import {readFile} from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";
import {createClient} from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const studioDir = path.resolve(__dirname, "..");
const siteDir = path.resolve(studioDir, "..");
const productsFile = path.join(siteDir, "data", "products.js");

const projectId = process.env.SANITY_PROJECT_ID || "";
const dataset = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_AUTH_TOKEN || "";
const replaceExisting = process.argv.includes("--replace");

if (!projectId || projectId === "REMPLACER_PROJECT_ID") {
  throw new Error("Missing SANITY_PROJECT_ID. Example: $env:SANITY_PROJECT_ID='abc123'");
}

if (!token) {
  throw new Error("Missing SANITY_AUTH_TOKEN. Create a Sanity write token and set it only in your terminal environment.");
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2026-05-12",
  token,
  useCdn: false,
});

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function readLocalProducts() {
  const source = await readFile(productsFile, "utf8");
  const context = {window: {}};
  vm.createContext(context);
  vm.runInContext(source, context, {filename: productsFile});
  return context.window.JOLIE_PRODUCTS || [];
}

async function uploadImage(imagePath, productName, index) {
  const absolutePath = path.join(siteDir, imagePath);
  const asset = await client.assets.upload("image", createReadStream(absolutePath), {
    filename: path.basename(imagePath),
    title: `${productName} ${index + 1}`,
  });

  return {
    _key: `image-${index + 1}`,
    _type: "image",
    alt: productName,
    asset: {
      _type: "reference",
      _ref: asset._id,
    },
  };
}

function productDocument(product, images, index) {
  const numericId = Number(product.id);
  return {
    _id: `product-${String(product.id).replace(/[^a-zA-Z0-9_-]/g, "-")}`,
    _type: "product",
    isActive: true,
    sortOrder: index + 1,
    productId: Number.isFinite(numericId) ? numericId : index + 1,
    name: product.name,
    slug: {
      _type: "slug",
      current: product.slug || slugify(product.name),
    },
    category: product.category || "Beauté",
    price: Number(product.price) || 0,
    priceNote: product.priceNote || "",
    description: product.description || product.name,
    summary: product.summary || "",
    usage: product.usage || "",
    suitedFor: product.suitedFor || "",
    images,
    variants: Array.isArray(product.variants)
      ? product.variants.map((variant) => ({
          _key: variant.id || slugify(variant.name),
          id: variant.id || slugify(variant.name),
          name: variant.name,
          price: Number(variant.price) || 0,
        }))
      : [],
  };
}

const products = await readLocalProducts();
console.log(`Preparing ${products.length} products for Sanity project ${projectId}/${dataset}.`);

for (const [index, product] of products.entries()) {
  const documentId = `product-${String(product.id).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  if (!replaceExisting) {
    const existing = await client.getDocument(documentId);
    if (existing) {
      console.log(`Already exists, skipped: ${product.name}`);
      continue;
    }
  }

  const images = [];
  for (const [imageIndex, imagePath] of (product.images || []).entries()) {
    images.push(await uploadImage(imagePath, product.name, imageIndex));
  }

  const document = productDocument(product, images, index);
  document._id = documentId;
  if (replaceExisting) {
    await client.createOrReplace(document);
  } else {
    await client.createIfNotExists(document);
  }
  console.log(`${replaceExisting ? "Upserted" : "Created if missing"}: ${product.name}`);
}

console.log("Import finished.");
