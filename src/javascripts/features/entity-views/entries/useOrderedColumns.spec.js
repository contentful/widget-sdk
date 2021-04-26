import { useOrderedColumns as orderedColumns } from './useOrderedColumns';
import * as spaceContext from 'classes/spaceContext';

jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));

jest.spyOn(spaceContext, 'getSpaceContext').mockImplementation(() => ({
  getId: jest.fn().mockReturnValue('spaceId'),
  getEnvironmentId: jest.fn().mockReturnValue('envId'),
  search: jest.fn(),
  replace: jest.fn(),
}));

const listViewContext = {
  getView: jest.fn().mockReturnValue({ order: { fieldId: 123 } }),
  setView: jest.fn(),
  assignView: jest.fn(),
};

const updateEntities = jest.fn();
const init = () => {
  return orderedColumns({ listViewContext, updateEntities });
};

describe('useSelectedEntities', () => {
  beforeEach(() => {
    listViewContext.assignView.mockClear();
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
    expect(listViewContext.assignView).not.toHaveBeenCalled();
  });

  it('should order column by field', () => {
    const [result] = init();
    result.orderColumnBy({ type: 'Date', id: 'date' });
    expect(listViewContext.assignView).toHaveBeenCalled();
    expect(listViewContext.assignView.mock.calls[0][0]).toEqual({
      order: { direction: 'ascending', fieldId: 'date' },
    });
    result.orderColumnBy({ type: 'Date', id: 'date' });
    expect(listViewContext.assignView.mock.calls[1][0]).toEqual({
      order: { direction: 'ascending', fieldId: 'date' },
    });
  });
});
