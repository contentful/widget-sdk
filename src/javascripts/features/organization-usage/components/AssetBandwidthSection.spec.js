import '@testing-library/dom';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { track } from 'analytics/Analytics';
import { AssetBandwidthSection } from './AssetBandwidthSection';
import { UsageStateContext } from '../hooks/usageContext';

const MockPovider = ({ children, assetBandwidthData, isLoading }) => (
  <UsageStateContext.Provider value={{ assetBandwidthData, isLoading }}>
    {children}
  </UsageStateContext.Provider>
);

const defaultData = {
  assetBandwidthData: {
    limit: 750,
    usage: 200,
    uom: 'GB',
  },
  isLoading: false,
};

const renderComp = (data) => {
  return render(
    <MockPovider {...data}>
      <AssetBandwidthSection />
    </MockPovider>
  );
};

describe('AssetBandwidthSection', () => {
  it('should render', () => {
    const { container } = renderComp(defaultData);
    expect(container).toMatchSnapshot();
  });

  it('should render correct data', () => {
    const { getByTestId } = renderComp(defaultData);
    const bandwidthUsage = getByTestId('asset-bandwidth-usage');
    const bandwidthLimit = getByTestId('asset-bandwidth-limit');
    expect(bandwidthUsage.textContent).toBe('200 GB');
    expect(bandwidthLimit.textContent).toBe('750 GB included');
  });

  it('should render overage with correct data', () => {
    const overageData = {
      assetBandwidthData: {
        limit: 200,
        usage: 750,
        uom: 'GB',
      },
    };
    const { getByTestId } = renderComp(overageData);
    const overage = getByTestId('asset-bandwidth-overage');
    expect(overage.textContent).toBe(' + 550 GB overage');
  });

  it('should track fair use policy clicks', () => {
    const { getByTestId } = renderComp(defaultData);
    fireEvent.click(getByTestId('fair_use_policy_link'));
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('usage:fair_use_policy_clicked', {
      source: 'Asset Bandwidth',
    });
  });

  it('should show skeleton on the initial loading', () => {
    // asset bandwidth data is not fetched (yet)
    const { getAllByTestId } = renderComp({ isLoading: true });

    getAllByTestId('cf-ui-skeleton-form').forEach((ele) => {
      expect(ele).toBeVisible();
    });
  });

  it('should not show skeleton if data already exists', () => {
    const { queryByTestId } = renderComp({ ...defaultData, isLoading: true });

    expect(queryByTestId('cf-ui-skeleton-form')).toBeNull();
  });
});