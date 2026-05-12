import {defineConfig} from "sanity";
import {structureTool} from "sanity/structure";
import {visionTool} from "@sanity/vision";
import {schemaTypes} from "./schemaTypes";

export default defineConfig({
  name: "jolie-lab-beauty",
  title: "Jolie Lab Beauty",
  projectId: "REMPLACER_PROJECT_ID",
  dataset: "production",
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
