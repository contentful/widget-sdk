import React from 'react';
import { render, screen } from '@testing-library/react';

import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import { ContentfulAppTile, ContentfulAppTileProps } from './ContentfulAppList';

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn(),
}));

const installAction = jest.fn();

const defaultValues = {
  slug: 'app',
  title: 'Compose + Launch',
  organizationId: '4wduOvOvkiyZ2XnDewhIu2',
  image: '<SvgLaunchComposeCombined />',
  text: 'Compose and Launch will elevate the experience of your content team, while creating and publishing all your best content.',
  canManage: true,
  spaceInformation: {
    spaceId: 'yg2xm8i0xdnu',
    spaceName: 'New space',
    envMeta: {
      environmentId: 'master',
      isMasterEnvironment: true,
    },
  },
  isInstalled: false,
  isPurchased: false,
  isTrialAvailable: false,
  installAction,
};

function build(props?: Partial<ContentfulAppTileProps>) {
  render(<ContentfulAppTile {...defaultValues} {...props} />);
}

// NOTE: Purchased is interchangable with Enabled

describe('ContentfulAppTile', () => {
  describe('when role is owner or admin', () => {
    beforeEach(() => {
      (isOwnerOrAdmin as jest.Mock).mockReturnValue(true);
    });

    it('should render the trial button when a trial is available and the add-on is not purchased', () => {
      build({ isTrialAvailable: true, isPurchased: false });
      expect(screen.queryByTestId('start-trial-button')).not.toBeNull();
    });

    it('should not render the trial button when a trial is not available', () => {
      build({ isTrialAvailable: false });
      expect(screen.queryByTestId('start-trial-button')).toBeNull();
    });

    it('should render the buy button when the add-on is not purchased and a trial is not available', () => {
      build({ isPurchased: false, isTrialAvailable: false });
      expect(screen.queryByTestId('buy-button')).not.toBeNull();
    });

    it('should render the install button when the add-on is purchased and a trial is available', () => {
      build({ isPurchased: true, isTrialAvailable: true });
      expect(screen.queryByTestId('install-button')).not.toBeNull();
    });

    it('should render the install button when the add-on is purchased and a trial is not available', () => {
      build({ isPurchased: true, isTrialAvailable: false });
      expect(screen.queryByTestId('install-button')).not.toBeNull();
    });
  });

  describe('when role is not owner or admin', () => {
    beforeEach(() => {
      (isOwnerOrAdmin as jest.Mock).mockReturnValue(false);
    });

    it('should render the learn more button', () => {
      build({ canManage: false });
      expect(screen.queryByTestId('learn-more-button')).not.toBeNull();
    });
  });
});
