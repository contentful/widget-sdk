import { getModule } from 'core/NgRegistry';
import { useOrderedColumns as orderedColumns } from './useOrderedColumns';

jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));
getModule.mockReturnValue({
  getId: jest.fn().mockReturnValue('spaceId'),
  getEnvironmentId: jest.fn().mockReturnValue('envId'),
  search: jest.fn(),
  replace: jest.fn(),
});

const listViewContext = {
  getView: jest.fn().mockReturnValue({ order: { fieldId: 123 } }),
  setView: jest.fn(),
  setViewKey: jest.fn(),
  setViewAssigned: jest.fn(),
};

const updateEntities = jest.fn();
const init = () => {
  return orderedColumns({ listViewContext, updateEntities });
};

describe('useSelectedEntities', () => {
  beforeEach(() => {
    listViewContext.setViewKey.mockClear();
  });
  it('should check if it is order field', () => {
    const [result] = init();
    expect(result.isOrderField({ id: 123 })).toBe(true);
    expect(result.isOrderField({ id: 321 })).toBe(false);
  });

  it('should check if it is a sortable field', () => {
    const [result] = init();
    expect(result.fieldIsSortable({ type: 'Date' })).toBe(true);
    expect(result.fieldIsSortable({ type: 'RichText' })).toBe(false);
    expect(result.fieldIsSortable({ id: 'author', type: 'Date' })).toBe(false);
  });

  it('should not order column by invalid field', () => {
    const [result] = init();
    result.orderColumnBy({ type: 'RichText', id: 'date' });
    expect(listViewContext.setViewKey).not.toHaveBeenCalled();
  });

  it('should order column by field', () => {
    const [result] = init();
    result.orderColumnBy({ type: 'Date', id: 'date' });
    expect(listViewContext.setViewKey).toHaveBeenCalled();
    expect(listViewContext.setViewKey.mock.calls[0][0]).toEqual('order');
    expect(listViewContext.setViewKey.mock.calls[0][1]).toEqual({
      fieldId: 'date',
      direction: 'ascending',
    });
    result.orderColumnBy({ type: 'Date', id: 'date' });
    expect(listViewContext.setViewKey.mock.calls[1][0]).toEqual('order');
    expect(listViewContext.setViewKey.mock.calls[1][1]).toEqual({
      fieldId: 'date',
      direction: 'ascending',
    });
  });
});
