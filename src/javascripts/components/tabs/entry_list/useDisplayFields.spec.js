import { renderHook, act } from '@testing-library/react-hooks';
import { useDisplayFields } from './useDisplayFields';
import createViewPersistor from 'data/ListViewPersistor';
import { getModule } from 'NgRegistry';

jest.mock('NgRegistry', () => ({ getModule: jest.fn() }));
getModule.mockReturnValue({
  getId: jest.fn().mockReturnValue('spaceId'),
  getEnvironmentId: jest.fn().mockReturnValue('envId'),
  search: jest.fn(),
  replace: jest.fn(),
  publishedCTs: {
    get: jest.fn().mockImplementation(
      (contentTypeId) =>
        contentTypeId && {
          data: {
            displayField: 0,
            fields: [{ id: 0 }, { disabled: true, id: 1 }, { id: 2 }],
          },
        }
    ),
  },
});

const updateEntities = jest.fn();
const initHook = (contentTypeId) => {
  const entityType = 'entry';
  const viewPersistor = createViewPersistor({ entityType });
  if (contentTypeId) {
    viewPersistor.saveKey('contentTypeId', contentTypeId);
  }
  return renderHook(() => useDisplayFields({ viewPersistor, updateEntities }));
};

describe('useSelectedEntities', () => {
  it('should initialize the displayed and hidden fields', () => {
    const { result } = initHook();

    expect(result.current[0].displayedFields).toEqual([
      {
        canPersist: true,
        id: 'contentType',
        name: 'Content Type',
        type: 'ContentType',
      },
      {
        canPersist: true,
        id: 'updatedAt',
        name: 'Updated',
        type: 'Date',
      },
      {
        id: 'author',
        name: 'Author',
        type: 'Symbol',
      },
    ]);
    expect(result.current[0].hiddenFields).toEqual([
      {
        id: 'createdAt',
        name: 'Created',
        type: 'Date',
        canPersist: true,
      },
      {
        id: 'publishedAt',
        name: 'Published',
        type: 'Date',
        canPersist: true,
      },
    ]);
    expect(updateEntities).toHaveBeenCalledTimes(1);
  });

  it('should be able to add a displayfield ', () => {
    const { result } = initHook();

    act(() => result.current[1].addDisplayField({ id: 'createdAt' }));

    expect(result.current[0].displayedFields).toEqual([
      {
        id: 'contentType',
        name: 'Content Type',
        type: 'ContentType',
        canPersist: true,
      },
      { id: 'updatedAt', name: 'Updated', type: 'Date', canPersist: true },
      { id: 'author', name: 'Author', type: 'Symbol' },
      { id: 'createdAt', name: 'Created', type: 'Date', canPersist: true },
    ]);
    expect(result.current[0].hiddenFields).toEqual([
      {
        id: 'publishedAt',
        name: 'Published',
        type: 'Date',
        canPersist: true,
      },
    ]);
    expect(updateEntities).toHaveBeenCalledTimes(2);
  });

  it('should be able to remove a displayfield ', () => {
    const { result } = initHook();

    act(() => result.current[1].removeDisplayField({ id: 'contentType' }));

    expect(result.current[0].displayedFields).toEqual([
      { id: 'updatedAt', name: 'Updated', type: 'Date', canPersist: true },
      { id: 'author', name: 'Author', type: 'Symbol' },
      { id: 'createdAt', name: 'Created', type: 'Date', canPersist: true },
    ]);
    expect(result.current[0].hiddenFields).toEqual([
      {
        id: 'contentType',
        name: 'Content Type',
        type: 'ContentType',
        canPersist: true,
      },
      {
        id: 'publishedAt',
        name: 'Published',
        type: 'Date',
        canPersist: true,
      },
    ]);
    expect(updateEntities).toHaveBeenCalledTimes(2);
  });

  it('should be able to sort the displayfields', () => {
    const { result } = initHook();

    const sortedFields = [
      {
        canPersist: true,
        id: 'updatedAt',
        name: 'Updated',
        type: 'Date',
      },
      {
        canPersist: true,
        id: 'createdAt',
        name: 'Created',
        type: 'Date',
      },
      {
        id: 'author',
        name: 'Author',
        type: 'Symbol',
      },
    ];
    act(() => result.current[1].updateFieldOrder(sortedFields));

    expect(result.current[0].displayedFields).toEqual(sortedFields);
    expect(result.current[0].hiddenFields).toEqual([
      {
        canPersist: true,
        id: 'contentType',
        name: 'Content Type',
        type: 'ContentType',
      },
      {
        id: 'publishedAt',
        name: 'Published',
        type: 'Date',
        canPersist: true,
      },
    ]);
    expect(updateEntities).toHaveBeenCalledTimes(2);
  });

  it('should initialize the displayed and hidden fields with additional fields according to contentTypeId', () => {
    const { result } = initHook(1);

    expect(result.current[0].displayedFields).toEqual([
      { id: 'updatedAt', name: 'Updated', type: 'Date', canPersist: true },
      { id: 'createdAt', name: 'Created', type: 'Date', canPersist: true },
      { id: 'author', name: 'Author', type: 'Symbol' },
    ]);
    expect(result.current[0].hiddenFields).toEqual([
      {
        id: 'contentType',
        name: 'Content Type',
        type: 'ContentType',
        canPersist: true,
      },
      {
        id: 'publishedAt',
        name: 'Published',
        type: 'Date',
        canPersist: true,
      },
      { id: 2 },
    ]);
    expect(updateEntities).toHaveBeenCalledTimes(1);
  });
});
