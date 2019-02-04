import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';

export default function register() {
  registerFactory('systemFields', () => {
    const createdAt = {
      id: 'createdAt',
      name: 'Created',
      type: 'Date',
      canPersist: true
    };

    const updatedAt = {
      id: 'updatedAt',
      name: 'Updated',
      type: 'Date',
      canPersist: true
    };

    const publishedAt = {
      id: 'publishedAt',
      name: 'Published',
      type: 'Date',
      canPersist: true
    };

    const author = {
      id: 'author',
      name: 'Author',
      type: 'Symbol'
    };

    const list = [createdAt, updatedAt, publishedAt, author];
    const defaultFields = [updatedAt, author];
    const fallbackFields = [publishedAt, createdAt, updatedAt];

    const defaultOrder = {
      fieldId: updatedAt.id,
      direction: 'descending'
    };

    return {
      getList: returnClone(list),
      getDefaultFieldIds: returnClone(_.map(defaultFields, 'id')),
      getDefaultOrder: returnClone(defaultOrder),
      getFallbackOrderField: getFallbackOrderField
    };

    function returnClone(obj) {
      return () => _.cloneDeep(obj);
    }

    function getFallbackOrderField(availableFieldIds) {
      return (
        _.find(fallbackFields, field => _.includes(availableFieldIds, field.id)) || {
          id: undefined
        }
      );
    }
  });
}
