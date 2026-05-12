import {defineField, defineType} from "sanity";

export const product = defineType({
  name: "product",
  title: "Produit",
  type: "document",
  fields: [
    defineField({
      name: "isActive",
      title: "Visible sur le site",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "sortOrder",
      title: "Ordre d'affichage",
      type: "number",
      description: "Plus le nombre est petit, plus le produit remonte dans le catalogue.",
    }),
    defineField({
      name: "productId",
      title: "Identifiant produit",
      type: "number",
      description: "Garder un numéro unique, par exemple 29 pour un nouveau produit.",
    }),
    defineField({
      name: "name",
      title: "Nom du produit",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Lien produit",
      type: "slug",
      options: {source: "name", maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Catégorie",
      type: "string",
      options: {
        list: ["Visage", "Corps", "Cheveux", "Packs", "Accessoires", "Maquillage", "Homme"],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "price",
      title: "Prix principal",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "priceNote",
      title: "Texte prix personnalisé",
      type: "string",
      description: "Optionnel. Utile pour les packs ou produits avec plusieurs formats.",
    }),
    defineField({
      name: "description",
      title: "Description originale",
      type: "text",
      rows: 10,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Résumé court",
      type: "text",
      rows: 3,
      description: "Optionnel. Affiché dans les cartes catalogue et les meta descriptions.",
    }),
    defineField({
      name: "usage",
      title: "Conseil d'utilisation",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "suitedFor",
      title: "Idéal pour",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [
        {
          type: "image",
          options: {hotspot: true},
          fields: [
            {
              name: "alt",
              title: "Texte alternatif",
              type: "string",
            },
          ],
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "variants",
      title: "Formats / variantes",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "id",
              title: "Identifiant",
              type: "string",
              description: "Exemple : petit, grand.",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "name",
              title: "Nom",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "price",
              title: "Prix",
              type: "number",
              validation: (Rule) => Rule.required().min(0),
            }),
          ],
          preview: {
            select: {title: "name", price: "price"},
            prepare({title, price}) {
              return {title, subtitle: price ? `${price} FCFA` : "Prix à renseigner"};
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "category",
      media: "images.0",
    },
  },
});
