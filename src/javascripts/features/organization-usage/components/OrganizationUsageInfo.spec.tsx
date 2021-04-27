import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { track } from 'analytics/Analytics';
import { OrganizationUsageInfo } from './OrganizationUsageInfo';
import { UsageStateContext, initialState } from '../hooks/usageContext';

const MockPovider = ({ children, totalUsage, apiRequestIncludedLimit, isLoading }) => (
  <UsageStateContext.Provider
    value={{
      ...initialState,
      totalUsage,
      apiRequestIncludedLimit,
      isLoading,
    }}>
    {children}
  </UsageStateContext.Provider>
);

const defaultData = {
  totalUsage: 23000,
  apiRequestIncludedLimit: 2000000,
};

const renderComp = (data) => {
  return render(
    <MockPovider {...data}>
      <OrganizationUsageInfo />
    </MockPovider>
  );
};

describe('OrganisationUsageInfo', () => {
  it('should render correct data', () => {
    const { getByTestId } = renderComp(defaultData);
    const total = getByTestId('org-usage-total');
    const limit = getByTestId('org-usage-limit');
    expect(total.textContent).toBe('23,000');
    expect(limit.textContent).toBe('2M');
  });

  it('should render overage', () => {
    const overageData = {
      totalUsage: 2500000,
      apiRequestIncludedLimit: 2000000,
    };

    const { getByTestId } = renderComp(overageData);
    const overage = getByTestId('org-usage-overage');
    expect(overage).toHaveTextContent('+500,000 overage');
  });

  it('should track fair use policy clicks', () => {
    const { getByTestId } = renderComp(defaultData);
    fireEvent.click(getByTestId('fair_use_policy_link'));
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('usage:fair_use_policy_clicked', { source: 'API Requests' });
  });

  it('should show skeleton when loading', () => {
    const { getAllByTestId } = renderComp({ ...defaultData, isLoading: true });

    getAllByTestId('cf-ui-skeleton-form').forEach((ele) => {
      expect(ele).toBeVisible();
    });
  });
});
