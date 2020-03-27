import React from 'react';
import { render } from '@testing-library/react';
import SnapshotPresenter from './SnapshotPresenter';

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'chrome' }),
}));

const entry = {
  fields: {
    fieldId: {
      'en-US': 'entry',
    },
  },
};

const snapshot = {
  fields: {
    fieldId: {
      'en-US': 'snapshot',
    },
  },
};

const getProps = (args = {}) => {
  const props = {
    editorData: { entity: { data: entry } },
    locale: {
      code: 'en-US',
      internal_code: 'en-US',
    },
    snapshot: { snapshot },
    widget: {
      settings: {},
      field: {
        linkType: 'Entry',
        id: 'fieldId',
        type: 'Symbol',
      },
    },
    version: 'current',
    ...args,
  };
  return props;
};

describe('SnapshotPresenter', () => {
  it('should render current text symbol with correct value', () => {
    const { getByTestId } = render(<SnapshotPresenter {...getProps()} />);
    const presenter = getByTestId('snapshot-presenter-standard');
    expect(presenter).toBeInTheDocument();
    expect(presenter.innerHTML).toBe(entry.fields.fieldId['en-US']);
  });

  it('should render snapshot text symbol with correct value', () => {
    const { getByTestId } = render(<SnapshotPresenter {...getProps({ version: 'snapshot' })} />);
    const presenter = getByTestId('snapshot-presenter-standard');
    expect(presenter).toBeInTheDocument();
    expect(presenter.innerHTML).toBe(snapshot.fields.fieldId['en-US']);
  });

  [
    ['null', null],
    ['undefined', undefined],
    ['empty string', ''],
    ['empty array', []],
    ['empty object', {}],
  ].forEach(([type, value]) => {
    const empty = {
      fields: {
        fieldId: {
          'en-US': value,
        },
      },
    };
    it(`should render empty if value is ${type}`, () => {
      const { getByTestId } = render(
        <SnapshotPresenter
          {...getProps({
            version: 'snapshot',
            snapshot: { snapshot: empty },
          })}
        />
      );
      const presenter = getByTestId('snapshot-presenter');
      expect(presenter).toBeInTheDocument();
      expect(presenter).toBeEmpty();
    });
  });

  [
    ['Boolean', false, 'boolean'],
    ['Array<Symbol>', ['foo'], 'arraysymbol'],
    ['Text', 'Text', 'markdown'],
    ['Symbol', 'Symbol', 'standard'],
    ['Object', { foo: 'bar' }, 'default'],
    ['Integer', 1, 'standard'],
    ['Number', 1.2, 'standard'],
    ['Date', '2020-02-21T19:33:33', 'date'],
    ['Location', { lat: 12, lng: 12 }, 'location'],
  ].forEach(([type, value, testIdSuffix]) => {
    const widget = {
      settings: {},
      field: {
        linkType: 'Entry',
        id: 'fieldId',
        type,
      },
    };
    it(`should render ${type}`, () => {
      const { getByTestId } = render(
        <SnapshotPresenter
          {...getProps({
            widget,
            editorData: {
              entity: {
                data: {
                  fields: {
                    fieldId: {
                      'en-US': value,
                    },
                  },
                },
              },
            },
          })}
        />
      );
      const presenter = getByTestId(`snapshot-presenter-${testIdSuffix}`);
      expect(presenter).toBeInTheDocument();
      expect(presenter).not.toBeEmpty();
    });
  });
});
