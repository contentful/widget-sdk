import { EntryFields, Entry } from 'contentful';

import { initWebappContentCDAClient } from 'core/services/ContentfulCDA';

const SPACE_PURCHASE_CONTENT_ENTRY_ID = '7LEmkkzUtr1x0cGXsP5Yof';

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
  const contentfulClient = await initWebappContentCDAClient();
  const data: PageContentEntry = await contentfulClient.getEntry(SPACE_PURCHASE_CONTENT_ENTRY_ID, {
    include: 2,
  });

  return data.fields;
}

export { fetchSpacePurchaseContent };
