export enum PlatformKind {
  SPACE = 'SPACE',
  SPACE_COMPOSE_LAUNCH = 'SPACE_COMPOSE_LAUNCH',
}

interface PlatformContent {
  type: PlatformKind;
  title: string;
  description: string;
  price?: number;
}

export const PLATFORM_CONTENT: { [key: string]: PlatformContent } = {
  spacePlatform: {
    type: PlatformKind.SPACE,
    title: 'Web app',
    description:
      'Your content platform, optimized for Developers. Includes access to our market-leading CMS, App Framework and intuitive APIs',
  },
  composePlatform: {
    type: PlatformKind.SPACE_COMPOSE_LAUNCH,
    title: 'Web app + Compose + Launch',
    description:
      'Content creators can easily manage web page content and coordinate content releases in our sleek new apps. Developers continue to manage content models in your spaces',
    price: 999,
  },
};
