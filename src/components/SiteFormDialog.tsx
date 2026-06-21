import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { id } from "@instantdb/react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import {
  getDefaultSiteFormValues,
  isSlugTaken,
  normalizeOptionalUrl,
  siteFormSchema,
  siteToFormValues,
  syncSlugFromName,
  validateLogoFile,
  type SiteFormValues,
} from "@/lib/site-form";
import { useSites, type SiteWithLogo } from "@/lib/sites";
import { slugify } from "@/lib/tasks";

type SiteFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  site?: SiteWithLogo;
};

export function SiteFormDialog({
  open,
  onOpenChange,
  mode,
  site,
}: SiteFormDialogProps) {
  const formKey = mode === "edit" && site ? site.id : "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <SiteFormDialogContent
          key={formKey}
          mode={mode}
          site={site}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
}

function SiteFormDialogContent({
  mode,
  site,
  onClose,
}: {
  mode: "create" | "edit";
  site?: SiteWithLogo;
  onClose: () => void;
}) {
  const { sites } = useSites();
  const [slugTouched, setSlugTouched] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    mode === "edit" && site ? (site.logo?.url ?? null) : null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues:
      mode === "edit" && site
        ? siteToFormValues(site)
        : getDefaultSiteFormValues(),
    validators: {
      onSubmit: siteFormSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);

      if (isSlugTaken(value.slug, sites, mode === "edit" ? site?.id : undefined)) {
        setSubmitError("A site with this slug already exists.");
        return;
      }

      if (logoFile) {
        const logoError = validateLogoFile(logoFile);
        if (logoError) {
          setSubmitError(logoError);
          return;
        }
      }

      try {
        const nextOrder =
          sites.length > 0
            ? Math.max(...sites.map((item) => item.order)) + 1
            : 0;

        if (mode === "create") {
          await createSite(value, logoFile, nextOrder);
        } else if (site) {
          await updateSite(site, value, logoFile, removeLogo);
        }

        onClose();
      } catch {
        setSubmitError("Failed to save site. Please try again.");
      }
    },
  });

  const handleLogoChange = (file: File | null) => {
    if (!file) return;

    const logoError = validateLogoFile(file);
    if (logoError) {
      setSubmitError(logoError);
      return;
    }

    setSubmitError(null);
    setLogoFile(file);
    setRemoveLogo(false);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setRemoveLogo(true);
    setLogoPreview(null);
  };

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {mode === "create" ? "Add site" : "Edit site"}
        </DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "Create a new site for the navbar and changelog."
            : "Update site details, links, and logo."}
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="name">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      const name = event.target.value;
                      field.handleChange(name);
                      if (!slugTouched) {
                        form.setFieldValue(
                          "slug",
                          syncSlugFromName(
                            name,
                            slugTouched,
                            form.state.values.slug,
                          ),
                        );
                      }
                    }}
                    placeholder="Site name"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          </form.Field>

          <form.Field name="slug">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      setSlugTouched(true);
                      field.handleChange(slugify(event.target.value));
                    }}
                    placeholder="site-slug"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Optional description"
                  />
                </FieldContent>
              </Field>
            )}
          </form.Field>

          <form.Field name="liveUrl">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Live URL</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    type="url"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="https://example.com (optional)"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          </form.Field>

          <form.Field name="githubUrl">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>GitHub URL</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    type="url"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="https://github.com/... (optional)"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          </form.Field>

          <Field>
            <FieldLabel htmlFor="site-logo">Logo</FieldLabel>
            <FieldContent>
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt=""
                    className="size-12 rounded-md border border-border object-cover"
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-md border border-dashed border-border bg-muted/30">
                    <ImagePlus className="size-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <label htmlFor="site-logo" className="cursor-pointer">
                      Choose image
                    </label>
                  </Button>
                  {logoPreview ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                    >
                      <X data-icon="inline-start" />
                      Remove
                    </Button>
                  ) : null}
                </div>
                <input
                  id="site-logo"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    handleLogoChange(file);
                    event.target.value = "";
                  }}
                />
              </div>
            </FieldContent>
          </Field>

          {submitError ? (
            <p className="text-sm text-destructive">{submitError}</p>
          ) : null}
        </FieldGroup>

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {mode === "create" ? "Add site" : "Save changes"}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

async function createSite(
  values: SiteFormValues,
  logoFile: File | null,
  nextOrder: number,
) {
  const siteId = id();
  const slug = values.slug.trim();
  const txs = [];

  txs.push(
    db.tx.sites[siteId].update({
      name: values.name.trim(),
      slug,
      description: values.description.trim() || undefined,
      liveUrl: normalizeOptionalUrl(values.liveUrl),
      githubUrl: normalizeOptionalUrl(values.githubUrl),
      order: nextOrder,
      createdAt: Date.now(),
    }),
  );

  if (logoFile) {
    const { data } = await db.storage.uploadFile(
      `sites/${slug}/logo-${logoFile.name}`,
      logoFile,
    );
    txs.push(db.tx.sites[siteId].link({ logo: data.id }));
  }

  await db.transact(txs);
}

async function updateSite(
  site: SiteWithLogo,
  values: SiteFormValues,
  logoFile: File | null,
  removeLogo: boolean,
) {
  const slug = values.slug.trim();
  const txs = [
    db.tx.sites[site.id].update({
      name: values.name.trim(),
      slug,
      description: values.description.trim() || undefined,
      liveUrl: normalizeOptionalUrl(values.liveUrl),
      githubUrl: normalizeOptionalUrl(values.githubUrl),
    }),
  ];

  if (removeLogo && site.logo) {
    txs.push(db.tx.sites[site.id].unlink({ logo: site.logo.id }));
  }

  if (logoFile) {
    if (site.logo) {
      txs.push(db.tx.sites[site.id].unlink({ logo: site.logo.id }));
    }

    const { data } = await db.storage.uploadFile(
      `sites/${slug}/logo-${logoFile.name}`,
      logoFile,
    );
    txs.push(db.tx.sites[site.id].link({ logo: data.id }));
  }

  await db.transact(txs);
}
