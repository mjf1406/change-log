import { z } from "zod";
import type { SiteWithLogo } from "@/lib/sites";
import { slugify } from "@/lib/tasks";

const optionalUrl = z.union([
  z.literal(""),
  z.string().url("Enter a valid URL"),
]);

export const siteFormSchema = z.object({
  name: z.string().trim().min(1, "Site name is required"),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must use lowercase letters, numbers, and hyphens",
    ),
  description: z.string(),
  liveUrl: optionalUrl,
  githubUrl: optionalUrl,
});

export type SiteFormValues = z.infer<typeof siteFormSchema>;

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export function getDefaultSiteFormValues(): SiteFormValues {
  return {
    name: "",
    slug: "",
    description: "",
    liveUrl: "",
    githubUrl: "",
  };
}

export function siteToFormValues(site: SiteWithLogo): SiteFormValues {
  return {
    name: site.name,
    slug: site.slug,
    description: site.description ?? "",
    liveUrl: site.liveUrl ?? "",
    githubUrl: site.githubUrl ?? "",
  };
}

export function validateLogoFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Logo must be an image file.";
  }

  if (file.size > LOGO_MAX_BYTES) {
    return "Logo must be 2MB or smaller.";
  }

  return null;
}

export function isSlugTaken(
  slug: string,
  sites: Array<{ id: string; slug: string }>,
  excludeId?: string,
): boolean {
  return sites.some((site) => site.slug === slug && site.id !== excludeId);
}

export function normalizeOptionalUrl(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function syncSlugFromName(
  name: string,
  slugTouched: boolean,
  currentSlug: string,
): string {
  return slugTouched ? currentSlug : slugify(name);
}
