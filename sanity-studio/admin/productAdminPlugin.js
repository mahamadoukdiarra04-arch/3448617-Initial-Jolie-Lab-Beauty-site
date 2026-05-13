import {definePlugin} from "sanity";
import React from "react";
import ProductAdminTool from "./ProductAdminTool.jsx";

function ProductAdminIcon() {
  return React.createElement(
    "span",
    {style: {fontSize: 18, fontWeight: 800, lineHeight: 1}, "aria-hidden": "true"},
    "JL",
  );
}

export const productAdminPlugin = definePlugin({
  name: "jolie-lab-product-admin",
  tools: [
    {
      name: "boutique-admin",
      title: "Boutique Admin",
      icon: ProductAdminIcon,
      component: ProductAdminTool,
    },
  ],
});
