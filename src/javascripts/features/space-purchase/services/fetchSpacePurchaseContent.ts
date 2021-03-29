import { EntryFields, Entry } from 'contentful';
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';

// Export only for testing
export const SPACE_PURCHASE_CONTENT_ENTRY_ID = '7LEmkkzUtr1x0cGXsP5Yof';
export const PLATFORM_PURCHASE_CONTENT_ENTRY_ID = '2NMTYEW3g02GyQF0R066Fn';

interface Faq {
  question: string;
  answer: EntryFields.RichText;
}
export type FaqEntry = Entry<Faq>;

export interface PageContent {
  pageName: string;
  content: Array<FaqEntry | Entry<unknown>>;
}

async function fetchSpacePurchaseContent() {
  return await fetchWebappContentByEntryID<PageContent>(SPACE_PURCHASE_CONTENT_ENTRY_ID);
}
async function fetchPlatformPurchaseContent() {
  return await fetchWebappContentByEntryID<PageContent>(PLATFORM_PURCHASE_CONTENT_ENTRY_ID);
}

export { fetchSpacePurchaseContent, fetchPlatformPurchaseContent };
