import '@testing-library/dom';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { track } from 'analytics/Analytics';
import { AssetBandwidthSection } from './AssetBandwidthSection';

describe('AssetBandwidthSection', () => {
  const defaultProps = {
    limit: 750,
    usage: 200,
    uom: 'GB',
  };

  const renderComp = (props) => {
    return render(<AssetBandwidthSection {...props} />);
  };

  it('should render', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('should render correct data', () => {
    const { getByTestId } = renderComp(defaultProps);
    const bandwidthUsage = getByTestId('asset-bandwidth-usage');
    const bandwidthLimit = getByTestId('asset-bandwidth-limit');
    expect(bandwidthUsage.textContent).toBe('200 GB');
    expect(bandwidthLimit.textContent).toBe('750 GB included');
  });

  it('should render overage with correct data', () => {
    const overageProps = {
      limit: 200,
      usage: 750,
      uom: 'GB',
    };
    const { getByTestId } = renderComp(overageProps);
    const overage = getByTestId('asset-bandwidth-overage');
    expect(overage.textContent).toBe(' + 550 GB overage');
  });

  it('should track fair use policy clicks', () => {
    const { getByTestId } = renderComp(defaultProps);
    fireEvent.click(getByTestId('fair_use_policy_link'));
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('usage:fair_use_policy_clicked');
  });
});
