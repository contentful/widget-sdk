import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContentfulAppsTrial } from './ContentfulAppsTrial';

import * as Fake from 'test/helpers/fakeFactory';

const startAppTrial = jest.fn();

const mockOrganization = Fake.Organization();

function build(props) {
  render(
    <ContentfulAppsTrial organization={mockOrganization} startAppTrial={startAppTrial} {...props} />
  );
}

describe('ContentfulAppTrial', () => {
  it('renders', () => {
    build();
    expect(screen.getByTestId('contentful-apps-trial')).toBeVisible();
  });

  it('should display Start Trial button for eligible users', () => {
    build({ isTrialAvailable: true });
    expect(screen.getByTestId('start-trial-button')).toBeVisible();
  });

  it('should display Buy Now button for eligible users', () => {
    build({ isTrialActive: true });
    expect(screen.getByTestId('buy-now-button')).toBeVisible();
  });
});
