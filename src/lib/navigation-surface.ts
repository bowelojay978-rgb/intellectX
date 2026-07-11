export type NavigationItem = {
  label: string;
  href: string;
};

type ResolveMobileNavigationSurfaceArgs = {
  nativeAppSurface: boolean;
  webItems: NavigationItem[];
  webLogoHref: string;
  nativeItems: NavigationItem[];
  nativeLogoHref: string;
};

export function resolveMobileNavigationSurface({
  nativeAppSurface,
  webItems,
  webLogoHref,
  nativeItems,
  nativeLogoHref,
}: ResolveMobileNavigationSurfaceArgs) {
  return nativeAppSurface
    ? { items: nativeItems, logoHref: nativeLogoHref }
    : { items: webItems, logoHref: webLogoHref };
}
