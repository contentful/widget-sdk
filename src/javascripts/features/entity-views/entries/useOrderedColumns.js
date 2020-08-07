import { get } from 'lodash';

export const useOrderedColumns = ({ listViewContext, updateEntities }) => {
  const SORTABLE_TYPES = ['Boolean', 'Date', 'Integer', 'Number', 'Symbol', 'Location'];

  const switchOrderDirection = (direction) => {
    return direction === 'ascending' ? 'descending' : 'ascending';
  };

  const isOrderField = ({ id }) => {
    const fieldId = get(listViewContext.getView(), 'order.fieldId');
    return fieldId === id;
  };

  const fieldIsSortable = (field) => {
    return (
      field && SORTABLE_TYPES.includes(field.type) && field.id !== 'author' && field.id !== 'tags'
    );
  };

  const orderColumnBy = (field) => {
    if (!fieldIsSortable(field)) return;
    const direction = get(listViewContext.getView(), 'order.direction');
    const newOrder = {
      fieldId: field.id,
      direction: switchOrderDirection(direction),
    };
    listViewContext.setViewKey('order', newOrder, () => {
      updateEntities();
    });
  };

  return [{ orderColumnBy, isOrderField, fieldIsSortable }];
};
