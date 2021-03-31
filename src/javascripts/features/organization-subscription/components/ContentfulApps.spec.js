import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContentfulApps } from './ContentfulApps';

import * as Fake from 'test/helpers/fakeFactory';

const startAppTrial = jest.fn();

const mockOrganization = Fake.Organization();
const fakePlan = Fake.Plan();

function build(props) {
  render(
    <ContentfulApps organization={mockOrganization} startAppTrial={startAppTrial} {...props} />
  );
}

describe('ContentfulAppTrial', () => {
  it('renders', () => {
    build();
    expect(screen.getByTestId('contentful-apps-card')).toBeVisible();
  });

  it('should display Start Trial button for eligible users', () => {
    build({ isTrialAvailable: true });
    expect(screen.getByTestId('start-trial-button')).toBeVisible();
  });

  it('should display Buy Now button for eligible users', () => {
    build({ isTrialActive: true });
    expect(screen.getByTestId('buy-now-button')).toBeVisible();
  });

  it('should display cancel C+L button when C+L has been purchased', () => {
    build({ addOnPlan: fakePlan });
    expect(screen.getByTestId('subscription-page.delete-apps')).toBeVisible();
  });
});
