import '@testing-library/dom';
import React from 'react';
import moment from 'moment';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { PeriodSelector } from './PeriodSelector';
import { UsageStateContext, UsageDispatchContext } from '../hooks/usageContext';
import { loadPeriodData } from '../services/UsageService';

jest.mock('../services/UsageService', () => ({
  loadPeriodData: jest.fn(),
}));

// set fixed date for stable snapshots
// moment('2017-12-01').unix() = 1512082800
jest.spyOn(Date, 'now').mockImplementation(() => 1512082800);

const DATE_FORMAT = 'YYYY-MM-DD';

// start date is 12 days before today
const startDate = moment().startOf('day').subtract(12, 'days');
const defaultData = {
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
};

const renderComp = (data, dispatch) => {
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
  dispatch,
}) => (
  <UsageStateContext.Provider
    value={{
      periods,
      selectedPeriodIndex,
      orgId,
      isTeamOrEnterpriseCustomer,
    }}>
    <UsageDispatchContext.Provider value={dispatch}>{children}</UsageDispatchContext.Provider>
  </UsageStateContext.Provider>
);

MockPovider.defaultProps = {
  dispatch: () => {},
};

describe('PeriodSelector', () => {
  it('should render', () => {
    const { container } = renderComp(defaultData);
    expect(container).toMatchSnapshot();
  });

  it('should load new period data when option is selected', async () => {
    loadPeriodData.mockReset().mockReturnValue(Promise.resolve({}));
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
});
