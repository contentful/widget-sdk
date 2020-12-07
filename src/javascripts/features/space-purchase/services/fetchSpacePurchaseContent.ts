import { EntryFields, Entry } from 'contentful';

import { initWebappContentCDAClient } from 'core/services/ContentfulCDA';

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
type PageContentEntry = Entry<PageContent>;

async function fetchSpacePurchaseContent() {
  return await fetchContentWithEntryID(SPACE_PURCHASE_CONTENT_ENTRY_ID);
}
async function fetchPlatformPurchaseContent() {
  return await fetchContentWithEntryID(PLATFORM_PURCHASE_CONTENT_ENTRY_ID);
}

async function fetchContentWithEntryID(entryId) {
  const contentfulClient = await initWebappContentCDAClient();
  const data: PageContentEntry = await contentfulClient.getEntry(entryId, {
    include: 2,
  });

  return data.fields;
}

export { fetchSpacePurchaseContent, fetchPlatformPurchaseContent };
