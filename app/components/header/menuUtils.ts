import type { MenuItem } from "@/types";

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

export const isMegaMenu = (item: MenuItem) => (item.key === "services") || slugify(item.label) === "services";
