import createViewPersistor from 'data/ListViewPersistor';
import { getModule } from 'NgRegistry';
import { useOrderedColumns as orderedColumns } from './useOrderedColumns';

jest.mock('NgRegistry', () => ({ getModule: jest.fn() }));
getModule.mockReturnValue({
  getId: jest.fn().mockReturnValue('spaceId'),
  getEnvironmentId: jest.fn().mockReturnValue('envId'),
  search: jest.fn(),
  replace: jest.fn(),
});

let spy;
const updateEntities = jest.fn();
const init = () => {
  const entityType = 'entry';
  const viewPersistor = createViewPersistor({ entityType });
  viewPersistor.saveKey('order.fieldId', 123);
  spy = jest.spyOn(viewPersistor, 'save');
  return orderedColumns({ viewPersistor, updateEntities });
};

describe('useSelectedEntities', () => {
  it('should check if it is order field', () => {
    const [result] = init();
    expect(result.isOrderField({ id: 123 })).toBe(true);
    expect(result.isOrderField({ id: 321 })).toBe(false);
    expect(updateEntities).toHaveBeenCalledTimes(0);
  });

  it('should check if it is a sortable field', () => {
    const [result] = init();
    expect(result.fieldIsSortable({ type: 'Date' })).toBe(true);
    expect(result.fieldIsSortable({ type: 'RichText' })).toBe(false);
    expect(result.fieldIsSortable({ id: 'author', type: 'Date' })).toBe(false);
    expect(updateEntities).toHaveBeenCalledTimes(0);
  });

  it('should not order column by invalid field', () => {
    const [result] = init();
    result.orderColumnBy({ type: 'RichText', id: 'date' });
    expect(spy).not.toHaveBeenCalled();
    expect(updateEntities).not.toHaveBeenCalled();
  });

  it('should order column by field', () => {
    const [result] = init();
    result.orderColumnBy({ type: 'Date', id: 'date' });
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].order).toEqual({
      fieldId: 'date',
      direction: 'ascending',
    });
    result.orderColumnBy({ type: 'Date', id: 'date' });
    expect(spy.mock.calls[1][0].order).toEqual({
      fieldId: 'date',
      direction: 'descending',
    });
    expect(updateEntities).toHaveBeenCalledTimes(2);
  });
});
