import { EntryCollection, EntryFields, Entry } from 'contentful';

import { initWebappContentCDAClient } from 'core/services/ContentfulCDA';

interface FaqEntry {
  question: string;
  answer: EntryFields.RichText;
}

type FaqEntries = Entry<FaqEntry>[];

async function fetchFaqEntries(): Promise<FaqEntries> {
  const contentfulClient = await initWebappContentCDAClient();
  const data: EntryCollection<FaqEntry> = await contentfulClient.getEntries({
    // eslint-disable-next-line @typescript-eslint/camelcase
    content_type: 'webappFaqEntry',
    include: 2,
  });

  return data.items;
}

export { fetchFaqEntries };
