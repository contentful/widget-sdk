import '@testing-library/dom';
import React from 'react';
import { render } from '@testing-library/react';
import AssetBandwidthSection from '../committed/AssetBandwidthSectionNew';

describe('AssetBandwidthSectionNew', () => {
  const defaultProps = {
    limit: 750,
    usage: 200,
    uom: 'GB'
  };

  const renderComp = props => {
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

  it('should render bandwidth data not available', () => {
    const undefinedProps = {
      limit: undefined,
      usage: undefined,
      uom: undefined
    };

    const { getByTestId } = renderComp(undefinedProps);
    const notAvilable = getByTestId('asset-bandwidth-not-available');
    expect(notAvilable.textContent).toBe('Not available');
  });

  it('should render overage with correct data', () => {
    const overageProps = {
      limit: 200,
      usage: 750,
      uom: 'GB'
    };
    const { getByTestId } = renderComp(overageProps);
    const overage = getByTestId('asset-bandwidth-overage');
    expect(overage.textContent).toBe(' + 550 GB overage');
  });
});
