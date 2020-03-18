import React from 'react';
import { render, fireEvent, within } from '@testing-library/react';
import * as echarts from 'echarts';

import { track } from 'analytics/Analytics';
import SpacesTabs from './SpacesTabs';

jest.mock('echarts', () => ({
  init: jest.fn()
}));

const defaultProps = {
  spaceNames: { cmaSpace: 'CMASpace', cdaSpace: 'CDASpace' },
  period: ['1 Feb', '2 Feb'],
  periodicUsage: {
    org: { usage: [147, 651] },
    apis: {
      cma: {
        items: [
          {
            usage: [48, 46],
            sys: {
              space: {
                sys: {
                  id: 'cmaSpace'
                }
              }
            }
          },
          {
            usage: [48, 56],
            sys: {
              space: {
                sys: {
                  id: 'Deleted space'
                }
              }
            }
          }
        ]
      },
      cda: {
        items: [
          {
            usage: [48, 66],
            sys: {
              space: {
                sys: {
                  id: 'cdaSpace'
                }
              }
            }
          }
        ]
      }
    }
  },
  isPoC: {
    cmaSpace: true,
    cdaSpace: false
  }
};

describe('SpacesTabs', () => {
  const build = props => {
    return render(<SpacesTabs {...props} />);
  };

  it('renders correctly', () => {
    const container = build(defaultProps);
    expect(container).toMatchSnapshot();
  });

  describe('by default', () => {
    it('renders CMA data correctly', () => {
      const { getByTestId, getByText } = build(defaultProps);
      const table = getByTestId('api-usage-table');
      expect(table).toBeInTheDocument();
      expect(getByText('94')).toBeInTheDocument();
      expect(getByText('104')).toBeInTheDocument();
      expect(getByText('CMASpace')).toBeInTheDocument();
    });

    describe('SpacesTable', () => {
      it('shows deleted space', () => {
        const { getByText } = build(defaultProps);
        expect(getByText('Deleted space')).toBeInTheDocument();
      });

      it('shows one space as PoC', () => {
        const { getAllByText } = build(defaultProps);
        const tags = getAllByText('POC');
        expect(tags).toHaveLength(1);
        fireEvent.mouseOver(tags[0]);
        expect(getAllByText('Proof of concept')).toHaveLength(1);
      });
    });

    it('renders a bar chart', () => {
      const { getByTestId } = build(defaultProps);
      expect(getByTestId('api-usage-bar-chart')).toBeInTheDocument();

      expect(echarts.init).toHaveBeenCalledTimes(1);
    });
  });

  describe('on CDA tab click', () => {
    it('renders CDA data correctly', () => {
      const { getByTestId, getByText } = build(defaultProps);
      fireEvent.click(getByText('CDA Requests'));

      const table = getByTestId('api-usage-table');
      expect(table).toBeInTheDocument();
      expect(getByText('114')).toBeInTheDocument();
      expect(getByText('CDASpace')).toBeInTheDocument();
    });

    describe('SpacesTable', () => {
      it('does not show any PoC spaces', () => {
        const { getByText, queryByText } = build(defaultProps);
        fireEvent.click(getByText('CDA Requests'));
        expect(queryByText('POC')).toBeNull();
      });
    });

    it('renders a bar chart and initializes once', () => {
      const { getByTestId, getByText } = build(defaultProps);
      expect(echarts.init).toHaveBeenCalledTimes(1);

      fireEvent.click(getByText('CDA Requests'));

      expect(getByTestId('api-usage-bar-chart')).toBeInTheDocument();
      expect(echarts.init).toHaveBeenCalledTimes(1);
    });

    it('sends a cma to cda tracking event', () => {
      const { getByText } = build(defaultProps);

      fireEvent.click(getByText('CDA Requests'));

      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith('usage:space_tab_selected', { new: 'cda', old: 'cma' });
    });
  });

  describe('with empty data', () => {
    const localProps = {
      spaceNames: {},
      period: [],
      periodicUsage: {
        apis: {
          cma: { items: [] },
          cda: { items: [] }
        },
        org: { usage: [] }
      },
      isPoC: {}
    };

    it('renders an empty table', () => {
      const { getByTestId, queryByTestId } = build(localProps);
      const table = getByTestId('api-usage-table');
      expect(table).toBeInTheDocument();
      expect(table.firstElementChild).toBeInTheDocument();
      within(table.firstChild).getByText('Current usage period');
      expect(queryByTestId('api-usage-table-row')).toBeNull();
    });

    it('renders a chart', () => {
      const { getByTestId } = build(localProps);
      expect(getByTestId('api-usage-bar-chart')).toBeInTheDocument();
      expect(echarts.init).toHaveBeenCalledTimes(1);
    });

    it('can switch tab', () => {
      const { getByTestId, getByText } = build(localProps);
      fireEvent.click(getByText('CDA Requests'));
      const table = getByTestId('api-usage-table');
      expect(table).toBeInTheDocument();

      expect(getByTestId('api-usage-bar-chart')).toBeInTheDocument();
    });
  });
});
