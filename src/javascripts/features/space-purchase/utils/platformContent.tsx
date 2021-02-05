import React from 'react';
import WebappIlustration from 'svg/illustrations/apps_purchase_1.svg';
import WebappAndAppsIlustration from 'svg/illustrations/apps_purchase_2.svg';

export enum PlatformKind {
  SPACE = 'SPACE',
  SPACE_COMPOSE_LAUNCH = 'SPACE_COMPOSE_LAUNCH',
}

interface PlatformContent {
  type: PlatformKind;
  illustration: React.ReactNode;
  title: string;
  description: string;
  price?: number;
}

export const PLATFORM_CONTENT: { [key: string]: PlatformContent } = {
  spacePlatform: {
    type: PlatformKind.SPACE,
    illustration: <WebappIlustration />,
    title: 'Web app',
    description:
      'Your content platform, optimized for Developers. Includes access to our market-leading CMS, App Framework and intuitive APIs',
  },
  composePlatform: {
    type: PlatformKind.SPACE_COMPOSE_LAUNCH,
    illustration: <WebappAndAppsIlustration />,
    title: 'Web app + Compose + Launch',
    description:
      'Content creators can easily manage web page content and coordinate content releases in our sleek new apps. Developers continue to manage content models in your spaces',
    price: 999,
  },
};
