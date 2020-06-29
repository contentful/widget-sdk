// This additional test file should be integrated into
// useDisplayFields.spec.js as soon as tags are not hidden behind a
// product catalog flag anymore.

import { renderHook, act } from '@testing-library/react-hooks';
import { useDisplayFields } from './useDisplayFields';
import createViewPersistor from 'data/ListViewPersistor';
import { getModule } from 'core/NgRegistry';

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

const updateEntities = jest.fn();
const initHook = (contentTypeId) => {
  const entityType = 'entry';
  const viewPersistor = createViewPersistor({ entityType });
  if (contentTypeId) {
    viewPersistor.saveKey('contentTypeId', contentTypeId);
  }
  return renderHook(() => useDisplayFields({ viewPersistor, updateEntities }));
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
