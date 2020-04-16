export const useOrderedColumns = ({ viewPersistor, updateEntities }) => {
  const SORTABLE_TYPES = ['Boolean', 'Date', 'Integer', 'Number', 'Symbol', 'Location'];

  const switchOrderDirection = (direction) => {
    return direction === 'ascending' ? 'descending' : 'ascending';
  };

  const isOrderField = ({ id }) => {
    const fieldId = viewPersistor.readKey('order.fieldId');
    return fieldId === id;
  };

  const fieldIsSortable = (field) => {
    return field && SORTABLE_TYPES.includes(field.type) && field.id !== 'author';
  };

  const orderColumnBy = (field) => {
    if (!fieldIsSortable(field)) return;
    const view = viewPersistor.read();
    const newOrder = {
      fieldId: field.id,
      direction: switchOrderDirection(view.order.direction),
    };
    viewPersistor.save({
      ...view,
      order: newOrder,
    });
    updateEntities();
  };

  return [{ orderColumnBy, isOrderField, fieldIsSortable }];
};
