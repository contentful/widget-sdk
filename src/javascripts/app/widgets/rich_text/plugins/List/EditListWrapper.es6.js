import { BLOCKS } from '@contentful/rich-text-types';
import EditList from '@guestbell/slate-edit-list';

export default opt => {
  return EditList({
    types: [BLOCKS.OL_LIST, BLOCKS.UL_LIST],
    typeItem: BLOCKS.LIST_ITEM,
    typeDefault: BLOCKS.PARAGRAPH,
    ...opt
  });
};
