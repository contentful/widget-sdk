import React from 'react';
import WebappIlustration from 'svg/illustrations/apps_purchase_1.svg';
import WebappAndAppsIlustration from 'svg/illustrations/apps_purchase_2.svg';

export enum PlatformKind {
  WEB_APP = 'WEB_APP',
  WEB_APP_COMPOSE_LAUNCH = 'WEB_APP_COMPOSE_LAUNCH',
}

interface Platform {
  type: PlatformKind;
  illustration: React.ReactNode;
  title: string;
  description: string;
}

interface PlatformContents {
  WEB_APP: Platform;
  COMPOSE_AND_LAUNCH: Platform;
}

export const PLATFORM_CONTENT: PlatformContents = {
  WEB_APP: {
    type: PlatformKind.WEB_APP,
    illustration: <WebappIlustration />,
    title: 'Web app only',
    description:
      'Your content platform, optimized for Developers. Includes access to our market-leading CMS, App Framework and intuitive APIs.',
  },
  COMPOSE_AND_LAUNCH: {
    type: PlatformKind.WEB_APP_COMPOSE_LAUNCH,
    illustration: <WebappAndAppsIlustration />,
    title: 'Web app + Compose + Launch',
    description:
      'Content creators can easily manage web page content and coordinate content releases in our sleek new apps. Developers spend less time helping others and more time building.',
  },
};
