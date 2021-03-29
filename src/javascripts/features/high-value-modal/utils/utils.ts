import { EntryFields, Entry, Asset } from 'contentful';

export const CUSTOM_ROLES_CONTENT_ENTRY_ID = '57081bvT4YDJecjTT8P2CZ';

export interface FeatureContent {
  pageName: string;
  content: Array<Entry<unknown>>;
  analyticsName: string;
  helpCenterUrl: string;
  illustration: Asset;
  learnMore: string;
  longDescription: EntryFields.RichText;
  name: string;
  primaryCtaAdmins: string;
  primaryCtaForMembers: string;
  scope: string;
  secondaryCtaForAdmins: string;
  secondaryCtaForMembers: string;
  shortDescription: EntryFields.RichText;
}

export type FeatureContentEntry = Entry<FeatureContent>;
