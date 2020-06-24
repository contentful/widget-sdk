import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FileSizeLimitWarning from './FileSizeLimitWarning';

describe('FileSizeLimitWarning', () => {
  it('should render the warning note for a user that is NOT the space owner', () => {
    build();

    expect(screen.getByTestId('asset-limit-warning')).toHaveTextContent(
      'The free community tier has a size limit of 50MB per asset.To increase your limit, the organization admin must upgrade this space.'
    );
  });

  it('should render the warning note for a user that is the space owner', () => {
    build({ isOrgOwner: true });

    expect(screen.getByTestId('asset-limit-warning')).toHaveTextContent(
      'The free community tier has a size limit of 50MB per asset.To increase your limit, upgrade this space.'
    );
  });

  it('should call onUpgradeSpace when the "upgrade this space" link is clicked', () => {
    const onUpgradeSpace = jest.fn();

    build({ isOrgOwner: true, onUpgradeSpace });
    userEvent.click(screen.getByText('upgrade this space.'));

    expect(onUpgradeSpace).toHaveBeenCalled();
  });
});

function build(customProps) {
  const props = {
    isOrgOwner: false,
    onUpgradeSpace: jest.fn(),
    ...customProps,
  };

  render(<FileSizeLimitWarning {...props} />);
}
