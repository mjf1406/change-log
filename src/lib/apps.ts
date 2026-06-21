export const APPS = [
  {
    slug: "solsim",
    name: "Solsim",
    description: "Solar simulation and modeling tools.",
  },
  {
    slug: "classclarus",
    name: "ClassClarus",
    description: "Classroom clarity and organization.",
  },
  {
    slug: "reciparoo",
    name: "Reciparoo",
    description: "Recipe discovery and management.",
  },
  {
    slug: "imagaroo",
    name: "Imagaroo",
    description: "Image creation and editing.",
  },
  {
    slug: "didjyah",
    name: "Didjyah",
    description: "Track what you did and when.",
  },
] as const;

export type AppSlug = (typeof APPS)[number]["slug"];

export function getAppBySlug(slug: string) {
  return APPS.find((app) => app.slug === slug);
}
