import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContentfulAppsTrial } from './ContentfulAppsTrial';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';

import * as Fake from 'test/helpers/fakeFactory';

jest.mock('services/OrganizationRoles', () => ({
  isOwnerOrAdmin: jest.fn(),
}));

const startAppTrial = jest.fn();

const mockOrganization = Fake.Organization();

function build(props) {
  render(
    <ContentfulAppsTrial
      organization={mockOrganization}
      startAppTrial={startAppTrial}
      isPurchased={false}
      {...props}
    />
  );
}

describe('ContentfulAppTrial', () => {
  it('renders', () => {
    build();
    expect(screen.getByTestId('contentful-apps-trial')).toBeVisible();
  });

  it('does not render when Apps were purchased', () => {
    const wrapper = build({ isPurchased: true });
    expect(wrapper).toBeUndefined();
  });

  it('should display Start Trial button for eligible users', () => {
    isOwnerOrAdmin.mockReturnValueOnce(true);
    build({ isTrialAvailable: true });
    expect(screen.getByTestId('start-trial-button')).toBeVisible();
  });

  it('should display Buy Now button for eligible users', () => {
    isOwnerOrAdmin.mockReturnValueOnce(true);
    build({ isTrialActive: true });
    expect(screen.getByTestId('buy-now-button')).toBeVisible();
  });
});
