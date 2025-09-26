export interface MenuLink {
  label: string;
  href: string;
  icon?: string;
}

export interface MenuGroup {
  title?: string | null;
  links: MenuLink[];
}

export interface MenuItem {
  label: string;
  href?: string;
  icon?: string;
  children?: MenuGroup[];
}

export interface MenuData {
  items: MenuItem[];
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

export const isMegaMenu = (label: string) => slugify(label) === "services";
