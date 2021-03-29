import { Entry } from 'contentful';
import { initWebappContentCDAClient } from 'core/services/ContentfulCDA';

// In order to type fetchWebappContentByEntryID correctly
// pass fields types specific for your example, like:
// fetchWebappContentByEntryID<SpecificFieldsType>('random_entry_id')

async function fetchWebappContentByEntryID<FieldsType>(entryId: string) {
  const contentfulClient = await initWebappContentCDAClient();
  const data: Entry<FieldsType> = await contentfulClient.getEntry(entryId, {
    include: 2,
  });

  return data.fields;
}

export { fetchWebappContentByEntryID };
