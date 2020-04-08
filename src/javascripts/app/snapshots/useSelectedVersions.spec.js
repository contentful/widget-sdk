import { renderHook, act } from '@testing-library/react-hooks';
import useSelectedVersions from './useSelectedVersions';

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'chrome' }),
}));

const enrichedWidgets = [
  {
    widget: {
      field: {
        id: 'fieldId1',
        localized: true,
      },
    },
    hasMultipleLocales: true,
    locales: [
      {
        locale: {
          internal_code: 'en-US',
        },
        fieldPath: 'fields.fieldId1.en-US',
        isDifferent: true,
      },
      {
        locale: {
          internal_code: 'de',
        },
        fieldPath: 'fields.fieldId1.de',
        isDifferent: false,
      },
    ],
  },
  {
    widget: {
      field: {
        id: 'fieldId2',
        localized: true,
      },
    },
    hasMultipleLocales: true,
    locales: [
      {
        locale: {
          internal_code: 'en-US',
        },
        fieldPath: 'fields.fieldId2.en-US',
        isDifferent: false,
      },
      {
        locale: {
          internal_code: 'de',
        },
        fieldPath: 'fields.fieldId2.de',
        isDifferent: true,
      },
    ],
  },
];

const initHook = (enrichedWidgets) => {
  return renderHook(() => useSelectedVersions({ enrichedWidgets }));
};

describe('useSelectedVersions', () => {
  it('should initialize the selected versions', () => {
    const { result } = initHook(enrichedWidgets);

    const [{ selectedVersions, pathsToRestore }] = result.current;

    expect(selectedVersions).toEqual({
      'fields.fieldId1.en-US': 'current',
      'fields.fieldId1.de': 'current',
      'fields.fieldId2.en-US': 'current',
      'fields.fieldId2.de': 'current',
    });
    expect(pathsToRestore).toEqual([]);
  });

  it('should set a specific field to specified to the selected version', () => {
    const { result } = initHook(enrichedWidgets);

    const [, { setSelectedVersionForField }] = result.current;

    act(() => setSelectedVersionForField('fields.fieldId1.en-US', 'snapshot'));

    const [{ selectedVersions, pathsToRestore }] = result.current;

    expect(selectedVersions).toEqual({
      'fields.fieldId1.en-US': 'snapshot',
      'fields.fieldId1.de': 'current',
      'fields.fieldId2.en-US': 'current',
      'fields.fieldId2.de': 'current',
    });
    expect(pathsToRestore).toEqual([['fields', 'fieldId1', 'en-US']]);
  });

  it('should set all different fields to snapshot', () => {
    const { result } = initHook(enrichedWidgets);

    const [, { setSelectAllSnapshots }] = result.current;

    act(() => setSelectAllSnapshots());

    const [{ selectedVersions, pathsToRestore }] = result.current;

    expect(selectedVersions).toEqual({
      'fields.fieldId1.en-US': 'snapshot',
      'fields.fieldId1.de': 'current',
      'fields.fieldId2.en-US': 'current',
      'fields.fieldId2.de': 'snapshot',
    });
    expect(pathsToRestore).toEqual([
      ['fields', 'fieldId1', 'en-US'],
      ['fields', 'fieldId2', 'de'],
    ]);
  });
});
