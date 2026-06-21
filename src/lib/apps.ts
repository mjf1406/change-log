export const APPS = [
  {
    slug: "classclarus",
    name: "ClassClarus",
    description: "Classroom clarity and organization.",
  },
  {
    slug: "didjyah",
    name: "DidjYah",
    description: "Track what you did and when.",
  },
  {
    slug: "imagaroo",
    name: "Imagaroo",
    description: "Image creation and editing.",
  },
  {
    slug: "reciparoo",
    name: "Reciparoo",
    description: "Recipe discovery and management.",
  },
  {
    slug: "solsim",
    name: "SolSim",
    description: "Solar simulation and modeling tools.",
  },
] as const;

export type AppSlug = (typeof APPS)[number]["slug"];

export function getAppBySlug(slug: string) {
  return APPS.find((app) => app.slug === slug);
}
