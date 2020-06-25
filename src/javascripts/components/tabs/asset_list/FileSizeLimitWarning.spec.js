import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as Fake from 'test/helpers/fakeFactory';
import * as Analytics from 'analytics/Analytics';
import { showDialog as showChangeSpaceModal } from 'services/ChangeSpaceService';
import { getOrgFeature } from 'data/CMA/ProductCatalog';
import { isOwner } from 'services/OrganizationRoles';
import FileSizeLimitWarning from './FileSizeLimitWarning';

const mockOrganization = Fake.Organization();
const mockSpace = Fake.Space();

jest.mock('services/TokenStore', () => ({
  getOrganization: jest.fn(async () => mockOrganization),
  getSpace: jest.fn(async () => mockSpace),
}));

jest.mock('data/CMA/ProductCatalog', () => ({
  getOrgFeature: jest.fn().mockResolvedValue(false),
}));

jest.mock('services/OrganizationRoles', () => ({
  isOwner: jest.fn(),
}));

jest.mock('services/ChangeSpaceService', () => ({
  showChangeSpaceModal: jest.fn(),
  showDialog: jest.fn(),
}));

jest.mock('analytics/Analytics', () => ({
  track: jest.fn(),
}));

describe('FileSizeLimitWarning', () => {
  it('should not render the warning note for a user that has the unlimited_asset_file_size feature', async () => {
    getOrgFeature.mockResolvedValueOnce(true);
    build();

    await waitFor(() => {
      expect(getOrgFeature).toBeCalled();
      expect(screen.queryByTestId('asset-limit-warning')).toBeNull();
    });
  });

  it('should render the warning note for a user without the unlimited_asset_file_size feature', async () => {
    build();

    await waitFor(() => expect(screen.getByTestId('asset-limit-warning')).toBeVisible());
  });

  it('should render the warning for a user that is NOT the space owner', async () => {
    build();

    await waitFor(() => expect(screen.getByTestId('asset-limit-warning')).toBeVisible());

    expect(screen.getByTestId('asset-limit-warning').textContent).toEqual(
      'The free community tier has a size limit of 50MB per asset.To increase your limit, the organization admin must upgrade this space.'
    );
  });

  it('should render the warning for a user that is the space owner', async () => {
    build();
    isOwner.mockReturnValue(true);

    await waitFor(() => () => expect(screen.getByTestId('asset-limit-warning')).toBeVisible());

    expect(screen.getByTestId('asset-limit-warning').textContent).toEqual(
      'The free community tier has a size limit of 50MB per asset.To increase your limit, upgrade this space.'
    );
    expect(screen.getByTestId('asset-limit-upgrade-link')).toBeVisible();
  });

  it('should call onUpgradeSpace when the "upgrade this space" link is clicked', async () => {
    build();
    isOwner.mockReturnValue(true);

    await waitFor(() => expect(screen.getByTestId('asset-limit-upgrade-link')).toBeVisible());

    userEvent.click(screen.getByTestId('asset-limit-upgrade-link'));

    expect(Analytics.track).toBeCalledWith(
      'asset_list:upgrade_plan_link_clicked',
      expect.objectContaining({
        organizationId: mockOrganization.sys.id,
        spaceId: mockSpace.sys.id,
      })
    );

    expect(showChangeSpaceModal).toBeCalledWith({
      organizationId: mockOrganization.sys.id,
      space: mockSpace,
    });
  });
});

function build(customProps) {
  const props = {
    organizationId: mockOrganization.sys.id,
    spaceId: mockSpace.sys.id,
    ...customProps,
  };

  render(<FileSizeLimitWarning {...props} />);
}
