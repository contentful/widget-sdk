import React from 'react';
import { render, fireEvent, within } from '@testing-library/react';
import SpacesTabs from '../committed/tabs/SpacesTabs';
import * as echarts from 'echarts';

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
            usage: [48, 46],
            sys: {
              space: {
                sys: {
                  id: 'Some space'
                }
              }
            }
          }
        ]
      },
      cda: {
        items: [
          {
            usage: [48, 46],
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
  }
};

describe('<SpacesTabs />', () => {
  const build = props => {
    return render(<SpacesTabs {...props} />);
  };

  it('renders correctly', () => {
    const container = build(defaultProps);
    expect(container).toMatchSnapshot();
  });

  describe('by default', () => {
    it('renders a CMA table', () => {
      const { getByTestId, getByText } = build(defaultProps);
      const table = getByTestId('api-usage-table');
      expect(table).toBeInTheDocument();
      within(table.firstChild).getByText('CMA');
      expect(getByText('CMASpace')).toBeInTheDocument();
    });

    describe('<SpacesTable />', () => {
      it('shows deleted space', () => {
        const { getByText } = build(defaultProps);
        expect(getByText('Deleted space')).toBeInTheDocument();
      });
    });

    it('renders a bar chart', () => {
      const { getByTestId } = build(defaultProps);
      expect(getByTestId('api-usage-bar-chart')).toBeInTheDocument();

      expect(echarts.init).toHaveBeenCalledTimes(1);
    });
  });

  describe('on CDA tab click', () => {
    it('renders a CDA table', () => {
      const { getByTestId, getByText } = build(defaultProps);
      fireEvent.click(getByText('CDA Requests'));

      const table = getByTestId('api-usage-table');
      expect(table).toBeInTheDocument();
      within(table.firstChild).getByText('CDA');
      expect(getByText('CDASpace')).toBeInTheDocument();
    });

    it('renders a bar chart and initializes once', () => {
      const { getByTestId, getByText } = build(defaultProps);
      expect(echarts.init).toHaveBeenCalledTimes(1);

      fireEvent.click(getByText('CDA Requests'));

      expect(getByTestId('api-usage-bar-chart')).toBeInTheDocument();
      expect(echarts.init).toHaveBeenCalledTimes(1);
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
      }
    };

    it('renders an empty table', () => {
      const { getByTestId, queryByTestId } = build(localProps);
      const table = getByTestId('api-usage-table');
      expect(table).toBeInTheDocument();
      expect(table.firstElementChild).toBeInTheDocument();
      within(table.firstChild).getByText('CMA');
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
      within(table.firstChild).getByText('CDA');

      expect(getByTestId('api-usage-bar-chart')).toBeInTheDocument();
    });
  });
});
