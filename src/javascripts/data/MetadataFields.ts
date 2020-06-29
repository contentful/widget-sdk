import { cloneDeep } from 'lodash';

export const METADATA_TAGS_ID = 'metadata.tags';

interface MetadataField {
  id: string;
  name: string;
  type: string;
  decoration?: string;
}

const tags: MetadataField = {
  id: METADATA_TAGS_ID,
  name: 'Tags',
  type: 'Symbol',
  decoration: 'new',
};

const list: MetadataField[] = [tags];

const returnCloneOf = (obj) => () => cloneDeep(obj);

export const getList = returnCloneOf(list);
