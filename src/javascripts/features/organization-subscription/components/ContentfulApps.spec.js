import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContentfulApps } from './ContentfulApps';
import { useAppsTrial } from 'features/trials';
import { MemoryRouter } from 'core/react-routing';

import * as Fake from 'test/helpers/fakeFactory';

const startAppTrial = jest.fn();

const mockOrganization = Fake.Organization();
const fakePlan = Fake.Plan();

jest.mock('features/trials', () => ({
  useAppsTrial: jest.fn().mockReturnValue({ canStartTrial: false }),
}));

function build(props) {
  render(
    <MemoryRouter>
      <ContentfulApps organization={mockOrganization} startAppTrial={startAppTrial} {...props} />
    </MemoryRouter>
  );
}

describe('ContentfulAppTrial', () => {
  it('renders', () => {
    build();
    expect(screen.getByTestId('contentful-apps-card')).toBeVisible();
  });

  it('should display Start Trial button for eligible users', () => {
    useAppsTrial.mockReturnValue({ canStartTrial: true });
    build();
    expect(screen.getByTestId('start-trial-button')).toBeVisible();
  });

  it('should display Buy Now button for eligible users', () => {
    useAppsTrial.mockReturnValue({ isAppsTrialActive: true });
    build();
    expect(screen.getByTestId('apps-trial-header')).toBeVisible();
    expect(screen.getByTestId('buy-now-button')).toBeVisible();
  });

  it('should display cancel C+L button when C+L has been purchased', () => {
    build({ addOnPlan: fakePlan });
    expect(screen.getByTestId('subscription-page.delete-apps')).toBeVisible();
  });

  it('should not display Start Trial button when C+L has been purchased', () => {
    build({ addOnPlan: fakePlan });
    expect(screen.queryByTestId('start-trial-button')).not.toBeInTheDocument();
  });
});
