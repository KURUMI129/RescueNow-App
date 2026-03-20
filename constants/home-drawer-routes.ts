export type HomeDrawerRouteId = "home" | "services" | "tracking" | "options";
export type HomeDrawerActionId = "services" | "tracking" | "options" | "logout";

export const HOME_DRAWER_PATHS = {
  home: "/(tabs)",
  services: "/(tabs)/services",
  tracking: "/(tabs)/tracking",
  options: "/(tabs)/options",
  logout: "/(auth)/login",
} as const;

const HOME_DRAWER_ACTION_PATHS: Record<Exclude<HomeDrawerActionId, "logout">, string> = {
  services: HOME_DRAWER_PATHS.services,
  tracking: HOME_DRAWER_PATHS.tracking,
  options: HOME_DRAWER_PATHS.options,
};

export function getHomeDrawerPathFromAction(
  actionId: Exclude<HomeDrawerActionId, "logout">,
) {
  return HOME_DRAWER_ACTION_PATHS[actionId];
}

export function getHomeDrawerRouteFromPath(pathname: string): HomeDrawerRouteId {
  if (pathname.includes(HOME_DRAWER_PATHS.services)) {
    return "services";
  }

  if (pathname.includes(HOME_DRAWER_PATHS.tracking)) {
    return "tracking";
  }

  if (pathname.includes(HOME_DRAWER_PATHS.options)) {
    return "options";
  }

  return "home";
}
