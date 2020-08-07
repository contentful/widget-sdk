import React from 'react';
import { render } from '@testing-library/react';
import SnapshotPresenter from './SnapshotPresenter';

jest.mock('detect-browser', () => ({
  detect: jest.fn().mockReturnValue({ name: 'chrome' }),
}));

jest.mock('services/PubSubService', () => ({
  createPubSubClientForSpace: jest.fn().mockReturnValue({
    on: jest.fn(),
    off: jest.fn(),
  }),
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
    editorData: {},
    entity: entry,
    locale: {
      code: 'en-US',
      internal_code: 'en-US',
    },
    widget: {
      widgetId: '',
      settings: {},
      field: {
        linkType: 'Entry',
        id: 'fieldId',
        type: 'Symbol',
      },
    },
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
    const { getByTestId } = render(<SnapshotPresenter {...getProps({ entity: snapshot })} />);
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
      const { getByTestId } = render(<SnapshotPresenter {...getProps({ entity: empty })} />);
      const presenter = getByTestId('snapshot-presenter');
      expect(presenter).toBeInTheDocument();
      expect(presenter).toBeEmptyDOMElement();
    });
  });

  [
    ['Boolean', false, 'boolean'],
    ['Array<Symbol>', ['foo'], 'arraysymbol'],
    ['Text', 'Text', 'standard'],
    ['Symbol', 'Symbol', 'standard'],
    ['Object', { foo: 'bar' }, 'default'],
    ['Integer', 1, 'standard'],
    ['Number', 1.2, 'standard'],
    ['Date', '2020-02-21T19:33:33', 'date'],
    ['Location', { lat: 12, lng: 12 }, 'location'],
  ].forEach(([type, value, testIdSuffix]) => {
    const widget = {
      settings: {},
      widgetId: '',
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
            entity: {
              fields: {
                fieldId: {
                  'en-US': value,
                },
              },
            },
          })}
        />
      );
      const presenter = getByTestId(`snapshot-presenter-${testIdSuffix}`);
      expect(presenter).toBeInTheDocument();
      expect(presenter).not.toBeEmptyDOMElement();
    });
  });
});
