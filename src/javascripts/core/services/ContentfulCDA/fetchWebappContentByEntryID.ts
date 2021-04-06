import { Entry } from 'contentful';
import { initWebappContentCDAClient } from 'core/services/ContentfulCDA';

/**
 * This is a util function to fetch a single content entry by passing its id
 *
 * In order to type your return value correctly, pass fields types specific for your example, like:
 * `fetchWebappContentByEntryID<SpecificFieldsType>('random_entry_id')`
 *
 * @param entryId - the id of your entry, you can find it in the web app under the 'info' tab
 * @param query - an object with parameters to be considered in the query that fetches the entry `(default: { include: 2 })`
 */
async function fetchWebappContentByEntryID<FieldsType>(entryId: string, query = { include: 2 }) {
  const contentfulClient = await initWebappContentCDAClient();
  const data: Entry<FieldsType> = await contentfulClient.getEntry(entryId, query);

  return data.fields;
}

export { fetchWebappContentByEntryID };
