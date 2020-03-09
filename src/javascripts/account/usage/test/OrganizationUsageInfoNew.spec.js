import React from 'react';
import { render } from '@testing-library/react';
import OrganizationUsageInfoNew from '../committed/OrganizationUsageInfoNew';

describe('OrganisationUsageInfoNew', () => {
  const defaultProps = {
    totalUsage: 23000,
    includedLimit: 2000000
  };

  const renderComp = props => {
    return render(<OrganizationUsageInfoNew {...props} />);
  };

  it('should render', () => {
    const { container } = renderComp(defaultProps);
    expect(container).toMatchSnapshot();
  });

  it('should render correct data', () => {
    const { getByTestId } = renderComp(defaultProps);
    const total = getByTestId('org-usage-total');
    const limit = getByTestId('org-usage-limit');
    expect(total.textContent).toBe('23,000');
    expect(limit.textContent).toBe('2M');
  });

  it('should render overage', () => {
    const overageProps = {
      totalUsage: 2500000,
      includedLimit: 2000000
    };

    const { getByTestId } = renderComp(overageProps);
    const overage = getByTestId('org-usage-overage');
    expect(overage).toHaveTextContent('+500,000 overage');
  });
});
