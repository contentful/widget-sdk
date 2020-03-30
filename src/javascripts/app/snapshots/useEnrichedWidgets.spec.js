import { renderHook } from '@testing-library/react-hooks';
import useEnrichedWidgets from './useEnrichedWidgets';

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'chrome' })
}));

jest.mock('services/localeStore', () => {
  const locales = [
    {
      internal_code: 'en-US'
    },
    {
      internal_code: 'de'
    }
  ];
  return {
    getPrivateLocales: jest.fn().mockReturnValue(locales),
    getDefaultLocale: locales[0],
    isLocaleActive: jest.fn().mockReturnValue(true)
  };
});

const widgets = [
  {
    field: {
      id: 'fieldId1',
      localized: true
    }
  },
  {
    field: {
      id: 'fieldId2',
      localized: true
    }
  }
];

const getEditorData = jest.fn().mockReturnValue({
  entity: {
    data: {
      fields: {
        fieldId1: {
          'en-US': 'versionEn1',
          de: 'versionEn1'
        },
        fieldId2: {
          'en-US': 'versionEn2',
          de: 'versionEn2'
        }
      }
    }
  }
});

const snapshot = {
  snapshot: {
    fields: {
      fieldId1: {
        'en-US': 'versionEn1Different',
        de: 'versionEn1'
      },
      fieldId2: {
        'en-US': 'versionEn2',
        de: 'versionEn2Different'
      }
    }
  }
};

const initHook = args => {
  return renderHook(() => useEnrichedWidgets(args));
};

describe('useEnrichedWidgets', () => {
  it('should enrich the widgets', () => {
    const { result } = initHook({ widgets, snapshot, getEditorData });

    const [{ diffCount, enrichedWidgets }] = result.current;

    expect(enrichedWidgets).toEqual([
      {
        widget: {
          field: {
            id: 'fieldId1',
            localized: true
          }
        },
        hasMultipleLocales: true,
        locales: [
          {
            locale: {
              internal_code: 'en-US'
            },
            fieldPath: 'fields.fieldId1.en-US',
            isDifferent: true
          },
          {
            locale: {
              internal_code: 'de'
            },
            fieldPath: 'fields.fieldId1.de',
            isDifferent: false
          }
        ]
      },
      {
        widget: {
          field: {
            id: 'fieldId2',
            localized: true
          }
        },
        hasMultipleLocales: true,
        locales: [
          {
            locale: {
              internal_code: 'en-US'
            },
            fieldPath: 'fields.fieldId2.en-US',
            isDifferent: false
          },
          {
            locale: {
              internal_code: 'de'
            },
            fieldPath: 'fields.fieldId2.de',
            isDifferent: true
          }
        ]
      }
    ]);
    expect(getEditorData).toHaveBeenCalledTimes(1);
    expect(diffCount).toBe(2);
  });

  it('should enrich the widgets only once', () => {
    const { rerender } = initHook({ widgets, snapshot, getEditorData });

    rerender();
    rerender();
    expect(getEditorData).toHaveBeenCalledTimes(1);
  });
});
