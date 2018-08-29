import { BLOCKS } from '@contentful/structured-text-types';
import EditList from 'slate-edit-list';

export const EDIT_LIST_OPTIONS = {
  types: [BLOCKS.OL_LIST, BLOCKS.UL_LIST],
  typeItem: BLOCKS.LIST_ITEM,
  typeDefault: BLOCKS.PARAGRAPH
};

export default opt => {
  return EditList({ ...EDIT_LIST_OPTIONS, ...opt });
};
