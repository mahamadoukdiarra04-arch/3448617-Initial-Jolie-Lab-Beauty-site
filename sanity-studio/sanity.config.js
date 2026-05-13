import {defineConfig} from "sanity";
import {structureTool} from "sanity/structure";
import {visionTool} from "@sanity/vision";
import {schemaTypes} from "./schemaTypes";
import {productAdminPlugin} from "./admin/productAdminPlugin";

export default defineConfig({
  name: "jolie-lab-beauty",
  title: "Jolie Lab Beauty",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "fkziz8e9",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  plugins: [productAdminPlugin(), structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
