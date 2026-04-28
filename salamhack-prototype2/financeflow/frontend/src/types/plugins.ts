export type InstalledPlugin = {
  id: string;
  name: string;
  description: string;
  version: string;
};

export type PluginsState = {
  installed: InstalledPlugin[];
  available: InstalledPlugin[];
};
