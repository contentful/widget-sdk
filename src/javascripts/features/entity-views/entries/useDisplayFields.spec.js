import { act, renderHook } from '@testing-library/react-hooks';
import { useDisplayFields } from './useDisplayFields';
import { getModule } from 'core/NgRegistry';
import { getBlankEntryView } from 'data/UiConfig/Blanks';

jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));
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

let mockView = getBlankEntryView();

const updateEntities = jest.fn();
const initHook = (contentTypeId) => {
  const listViewContext = {
    getView: jest.fn().mockImplementation(() => mockView),
    setView: jest.fn().mockImplementation((view) => (mockView = view)),
    setViewKey: jest.fn().mockImplementation((key, value) => (mockView[key] = value)),
    setViewAssigned: jest.fn().mockImplementation((view) => ({ ...mockView, ...view })),
  };
  if (contentTypeId) {
    mockView.contentTypeId = contentTypeId;
  }
  return renderHook(() =>
    useDisplayFields({
      listViewContext,
      updateEntities,
    })
  );
};

describe('useSelectedEntities', () => {
  beforeEach(() => {
    mockView = getBlankEntryView();
  });
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
      {
        id: 'metadata.tags',
        name: 'Tags',
        type: 'Symbol',
        decoration: 'new',
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
      {
        id: 'metadata.tags',
        name: 'Tags',
        type: 'Symbol',
        decoration: 'new',
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
    ]);
    expect(result.current[0].hiddenFields).toEqual([
      {
        id: 'contentType',
        name: 'Content Type',
        type: 'ContentType',
        canPersist: true,
      },

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
      {
        id: 'metadata.tags',
        name: 'Tags',
        type: 'Symbol',
        decoration: 'new',
      },
    ]);
    expect(updateEntities).toHaveBeenCalledTimes(2);
  });

  it('should be able to sort the displayfields', () => {
    const { result } = initHook();

    const sortedFields = [
      {
        canPersist: true,
        id: 'contentType',
        name: 'Content Type',
        type: 'ContentType',
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
    expect(updateEntities).toHaveBeenCalledTimes(2);
  });

  it('should initialize the displayed and hidden fields with additional fields according to contentTypeId', () => {
    const { result } = initHook(1);

    expect(result.current[0].displayedFields).toEqual([
      { canPersist: true, id: 'contentType', name: 'Content Type', type: 'ContentType' },
      { canPersist: true, id: 'updatedAt', name: 'Updated', type: 'Date' },
      { id: 'author', name: 'Author', type: 'Symbol' },
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
      {
        id: 'metadata.tags',
        name: 'Tags',
        type: 'Symbol',
        decoration: 'new',
      },
      { id: 2 },
    ]);
    expect(updateEntities).toHaveBeenCalledTimes(1);
  });
});
