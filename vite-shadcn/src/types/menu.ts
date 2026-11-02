export type MenuType = "menu" | "directory";

export type MenuNode = {
  id: string;
  path: string;
  type: MenuType;
  name: string;
  children: MenuNode[];
};
