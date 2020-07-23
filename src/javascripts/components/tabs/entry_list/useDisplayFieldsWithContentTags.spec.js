// This additional test file should be integrated into
// useDisplayFields.spec.js as soon as tags are not hidden behind a
// product catalog flag anymore.

import { renderHook, act } from '@testing-library/react-hooks';
import { useDisplayFields } from './useDisplayFields';
import { getModule } from 'core/NgRegistry';
import { getBlankEntryView } from 'data/UiConfig/Blanks';

jest.mock('features/content-tags/core/hooks/useTagsFeatureEnabled', () => ({
  useTagsFeatureEnabled: jest.fn().mockReturnValue({ tagsEnabled: true }),
}));

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
  return renderHook(() => useDisplayFields({ listViewContext, updateEntities }));
};

describe('useSelectedEntities with tags pc enabled', () => {
  it('should initialize the displayed and hidden fields with tags field included', () => {
    const { result } = initHook();
    expect(
      result.current[0].displayedFields.some((field) => {
        return field.id === 'metadata.tags' && field.name === 'Tags';
      })
    ).toBeFalse();
    expect(
      result.current[0].hiddenFields.some((field) => {
        return field.id === 'metadata.tags' && field.name === 'Tags';
      })
    ).toBeTrue();
    expect(updateEntities).toHaveBeenCalledTimes(1);
  });

  it('should be able to add tags as a displayfield ', () => {
    const { result } = initHook();
    act(() => result.current[1].addDisplayField({ id: 'metadata.tags' }));
    expect(
      result.current[0].displayedFields.some((field) => {
        return field.id === 'metadata.tags' && field.name === 'Tags';
      })
    ).toBeTrue();
    expect(
      result.current[0].hiddenFields.some((field) => {
        return field.id === 'metadata.tags' && field.name === 'Tags';
      })
    ).toBeFalse();
    expect(updateEntities).toHaveBeenCalledTimes(2);
  });

  it('should be able to remove tags as a displayfield ', () => {
    const { result } = initHook();
    act(() => result.current[1].removeDisplayField({ id: 'metadata.tags' }));
    expect(
      result.current[0].displayedFields.some((field) => {
        return field.id === 'metadata.tags' && field.name === 'Tags';
      })
    ).toBeFalse();
    expect(
      result.current[0].hiddenFields.some((field) => {
        return field.id === 'metadata.tags' && field.name === 'Tags';
      })
    ).toBeTrue();
    expect(updateEntities).toHaveBeenCalledTimes(2);
  });
});
