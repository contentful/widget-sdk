import '@testing-library/dom';
import React from 'react';
import moment from 'moment';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { PeriodSelector } from './PeriodSelector';
import { UsageStateContext, UsageDispatchContext, initialState } from '../hooks/usageContext';
import { loadPeriodData } from '../services/UsageService';

jest.mock('../services/UsageService', () => ({
  loadPeriodData: jest.fn(),
}));

// moment('2017-12-01').unix() = 1512082800
jest.spyOn(Date, 'now').mockImplementation(() => 1512082800);

const DATE_FORMAT = 'YYYY-MM-DD';

// start date is 12 days before today
const startDate = moment().startOf('day').subtract(12, 'days');
const defaultData = {
  ...initialState,
  periods: [
    {
      sys: { type: 'UsagePeriod', id: 'period1' },
      startDate: startDate.format(DATE_FORMAT),
      endDate: null,
    },
    {
      sys: { type: 'UsagePeriod', id: 'period1' },
      startDate: moment(startDate).subtract(1, 'day').subtract(1, 'month').format(DATE_FORMAT),
      endDate: moment(startDate).subtract(1, 'day').format(DATE_FORMAT),
    },
  ],
  selectedPeriodIndex: 0,
  orgId: 'abcd',
  isTeamOrEnterpriseCustomer: true,
  isAssetBandwidthTab: false,
};

const renderComp = (data, dispatch = jest.fn()) => {
  return render(
    <MockPovider {...data} dispatch={dispatch}>
      <PeriodSelector />
    </MockPovider>
  );
};

const MockPovider = ({
  children,
  periods,
  selectedPeriodIndex,
  orgId,
  isTeamOrEnterpriseCustomer,
  isAssetBandwidthTab,
  dispatch,
}) => (
  <UsageStateContext.Provider
    value={{
      ...initialState,
      periods,
      selectedPeriodIndex,
      orgId,
      isTeamOrEnterpriseCustomer,
      isAssetBandwidthTab,
    }}>
    <UsageDispatchContext.Provider value={dispatch}>{children}</UsageDispatchContext.Provider>
  </UsageStateContext.Provider>
);

describe('PeriodSelector', () => {
  it('should load new period data when option is selected', async () => {
    (loadPeriodData as jest.Mock).mockReset().mockReturnValue(Promise.resolve({}));
    const dispatchSpy = jest.fn();
    const { getByTestId } = renderComp(defaultData, dispatchSpy);

    expect(loadPeriodData).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();

    const periodSelector = getByTestId('period-selector');
    fireEvent.change(periodSelector, { target: { value: 1 } });

    expect(dispatchSpy).toHaveBeenCalledWith({ type: 'SET_LOADING', value: true });
    expect(loadPeriodData).toHaveBeenCalledWith(defaultData.orgId, defaultData.periods[1]);
    await waitFor(() => expect(dispatchSpy).toHaveBeenCalledTimes(4));
    expect(dispatchSpy).toHaveBeenCalledWith({ type: 'SET_USAGE_DATA', value: {} });
    expect(dispatchSpy).toHaveBeenCalledWith({ type: 'CHANGE_PERIOD', value: 1 });
    expect(dispatchSpy).toHaveBeenCalledWith({ type: 'SET_LOADING', value: false });
  });

  it('should correctly show the helper text', () => {
    const { getByText, getByTestId } = renderComp(defaultData);
    expect(getByText('current', { exact: false })).toBeVisible();

    const periodSelector = getByTestId('period-selector');
    fireEvent.change(periodSelector, { target: { value: 1 } });
    expect(getByText('a month ago', { exact: false })).toBeVisible();
  });

  it('should render the period selector for team and enterprise tier on the API requests tab', async () => {
    const { getByTestId } = renderComp(defaultData);
    expect(getByTestId('period-selector')).toBeVisible();
  });

  it('should render the disabled period selector with a current period selected on the assetbandwidth tab', async () => {
    const { getByTestId, getByText } = renderComp({
      ...defaultData,
      isAssetBandwidthTab: true,
    });
    expect(getByTestId('period-selector')).toBeDisabled();
    expect(getByText('current', { exact: false })).toBeVisible();
  });

  it('should render the current period text for community tier users', async () => {
    const { getByTestId } = renderComp({ ...defaultData, isTeamOrEnterpriseCustomer: false });
    expect(getByTestId('usage-period-text')).toBeVisible();
  });
});
