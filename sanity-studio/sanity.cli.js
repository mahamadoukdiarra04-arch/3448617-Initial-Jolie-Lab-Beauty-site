import {defineCliConfig} from "sanity/cli";

export default defineCliConfig({
  studioHost: "jolie-lab-beauty",
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || "fkziz8e9",
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
});
