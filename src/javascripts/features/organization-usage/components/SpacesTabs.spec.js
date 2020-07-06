import React from 'react';
import { render, fireEvent, within } from '@testing-library/react';
import * as echarts from 'echarts';

import { track } from 'analytics/Analytics';
import { SpacesTabs } from './SpacesTabs';

import { UsageStateContext, UsageDispatchContext } from '../hooks/usageContext';
import { sum } from 'lodash';

jest.mock('echarts', () => ({
  init: jest.fn(),
}));

const ORG_USAGE = [147, 651];
const CMA_USAGE = [48, 46];
const CMA_USAGE_DELETED_SPACE = [48, 56];
const CDA_USAGE = [48, 66];

const defaultData = {
  spaceNames: { cmaSpace: 'CMASpace', cdaSpace: 'CDASpace' },
  periodDates: ['1 Feb', '2 Feb'],
  periodicUsage: {
    org: { usage: ORG_USAGE },
    apis: {
      cma: {
        items: [
          {
            usage: CMA_USAGE,
            sys: {
              space: {
                sys: {
                  id: 'cmaSpace',
                },
              },
            },
          },
          {
            usage: CMA_USAGE_DELETED_SPACE,
            sys: {
              space: {
                sys: {
                  id: 'Deleted space',
                },
              },
            },
          },
        ],
      },
      cda: {
        items: [
          {
            usage: CDA_USAGE,
            sys: {
              space: {
                sys: {
                  id: 'cdaSpace',
                },
              },
            },
          },
        ],
      },
    },
  },
  isPoC: {
    cmaSpace: true,
    cdaSpace: false,
  },
  selectedSpacesTab: 'cma',
  totalUsage: sum(ORG_USAGE),
};

const renderComp = (data, dispatch) => {
  return render(
    <MockPovider {...data} dispatch={dispatch}>
      <SpacesTabs />
    </MockPovider>
  );
};

const MockPovider = (data) => {
  const { dispatch, children } = data;
  return (
    <UsageStateContext.Provider value={data}>
      <UsageDispatchContext.Provider value={dispatch}>{children}</UsageDispatchContext.Provider>
    </UsageStateContext.Provider>
  );
};

MockPovider.defaultProps = {
  dispatch: () => {},
};

describe('SpacesTabs', () => {
  it('renders correctly', () => {
    const container = renderComp(defaultData);
    expect(container).toMatchSnapshot();
  });

  describe('by default', () => {
    it('renders CMA data correctly', () => {
      const { getByTestId, getByText } = renderComp(defaultData);

      const table = getByTestId('api-usage-table');
      expect(table).toBeInTheDocument();

      const usage = `${sum(CMA_USAGE)}`;
      expect(getByText(usage)).toBeInTheDocument();

      const usageDeletedSpace = `${sum(CMA_USAGE_DELETED_SPACE)}`;
      expect(getByText(usageDeletedSpace)).toBeInTheDocument();

      expect(getByText('CMASpace')).toBeInTheDocument();
    });

    describe('SpacesTable', () => {
      it('shows deleted space', () => {
        const { getByText } = renderComp(defaultData);
        expect(getByText('Deleted space')).toBeInTheDocument();
      });

      it('shows one space as PoC', () => {
        const { getAllByText } = renderComp(defaultData);
        const tags = getAllByText('POC');
        expect(tags).toHaveLength(1);
        fireEvent.mouseOver(tags[0]);
        expect(getAllByText('Proof of concept')).toHaveLength(1);
      });
    });

    it('renders a bar chart', () => {
      const { getByTestId } = renderComp(defaultData);
      expect(getByTestId('api-usage-bar-chart')).toBeInTheDocument();

      expect(echarts.init).toHaveBeenCalledTimes(1);
    });
  });

  describe('on CDA tab click', () => {
    it('switch to the correct tab', () => {
      const dispatchSpy = jest.fn();
      const { getByText } = renderComp(defaultData, dispatchSpy);

      expect(dispatchSpy).not.toHaveBeenCalled();
      fireEvent.click(getByText('CDA Requests'));
      expect(dispatchSpy).toHaveBeenCalledWith({ type: 'SWITCH_SPACES_TAB', value: 'cda' });
    });

    it('renders CDA data correctly', () => {
      const updatedData = {
        ...defaultData,
        selectedSpacesTab: 'cda',
      };

      const { getByText, getByTestId } = renderComp(updatedData);

      const table = getByTestId('api-usage-table');
      expect(table).toBeInTheDocument();

      const usage = `${sum(CDA_USAGE)}`;
      expect(getByText(usage)).toBeInTheDocument();

      expect(getByText('CDASpace')).toBeInTheDocument();
    });

    it('does not show any PoC spaces', () => {
      const updatedData = {
        ...defaultData,
        selectedSpacesTab: 'cda',
      };

      const { queryByText } = renderComp(updatedData);
      expect(queryByText('POC')).toBeNull();
    });

    it('renders a bar chart and initializes once', () => {
      const { getByTestId, getByText } = renderComp(defaultData);
      expect(echarts.init).toHaveBeenCalledTimes(1);

      fireEvent.click(getByText('CDA Requests'));

      expect(getByTestId('api-usage-bar-chart')).toBeInTheDocument();
      expect(echarts.init).toHaveBeenCalledTimes(1);
    });

    it('sends a cma to cda tracking event', () => {
      const { getByText } = renderComp(defaultData);

      fireEvent.click(getByText('CDA Requests'));

      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith('usage:space_tab_selected', { new: 'cda', old: 'cma' });
    });
  });

  describe('with empty data', () => {
    const data = {
      spaceNames: {},
      period: [],
      periodicUsage: {
        apis: {
          cma: { items: [] },
          cda: { items: [] },
        },
        org: { usage: [] },
      },
      isPoC: {},
      selectedSpacesTab: 'cma',
    };

    it('renders an empty table', () => {
      const { getByTestId, queryByTestId } = renderComp(data);
      const table = getByTestId('api-usage-table');
      expect(table).toBeInTheDocument();
      expect(table.firstElementChild).toBeInTheDocument();
      within(table.firstChild).getByText('Current usage period');
      expect(queryByTestId('api-usage-table-row')).toBeNull();
    });

    it('renders a chart', () => {
      const { getByTestId } = renderComp(data);
      expect(getByTestId('api-usage-bar-chart')).toBeInTheDocument();
      expect(echarts.init).toHaveBeenCalledTimes(1);
    });

    it('can switch tab', () => {
      const { getByTestId, getByText } = renderComp(data);
      fireEvent.click(getByText('CDA Requests'));
      const table = getByTestId('api-usage-table');
      expect(table).toBeInTheDocument();

      expect(getByTestId('api-usage-bar-chart')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows skeleton rows', () => {
      const { getAllByTestId } = renderComp({ ...defaultData, isLoading: true });

      getAllByTestId('cf-ui-skeleton-form').forEach((ele) => {
        expect(ele).toBeVisible();
      });
    });
  });
});
