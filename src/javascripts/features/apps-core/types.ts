import { SysLink } from 'contentful-management/types';

interface Link {
  title: string;
  shortTitle: string;
  url: string;
}

export interface MarketplaceApp {
  id: string;
  title: string;
  tagLine?: string;
  icon?: string;
  appInstallation?: {
    sys: {
      [key: string]: any;
      appDefinition: SysLink;
    };
    [key: string]: any;
  };
  appDefinition: {
    sys: {
      type: string;
      id: string;
      organization: SysLink;
      [key: string]: any;
    };
    [key: string]: any;
  };
  definitionId?: string;
  isPrivateApp?: boolean;
  isEarlyAccess?: boolean;
  isListed?: boolean;
  author?: {
    name: string;
    url: string;
    icon: string;
  };
  categories?: string[];
  description?: string;
  links?: Link[];
  legal?: { eula: string; privacyPolicy: string };
  actionList?: { negative: boolean; info: string }[];
  documentationLink?: Link;
  featureFlagName?: string | null;
  supportUrl?: string;
  isContentfulApp?: boolean;
  learnMoreUrl?: string;
  isPaidApp?: boolean;
}

export type NonInstallableMarketplaceApp = Omit<MarketplaceApp, 'appDefinition'>;
