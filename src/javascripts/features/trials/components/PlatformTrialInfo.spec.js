import React from 'react';
import { render, screen } from '@testing-library/react';
import * as fake from 'test/helpers/fakeFactory';
import { PlatformTrialInfo } from './PlatformTrialInfo';
import { isOrganizationOnTrial } from '../services/TrialService';
import { calcTrialDaysLeft } from '../utils';

const mockOrganization = fake.Organization();

jest.mock('../services/TrialService', () => ({
  isOrganizationOnTrial: jest.fn(),
}));

jest.mock('../utils', () => ({
  calcTrialDaysLeft: jest.fn(),
}));

const build = () => {
  render(<PlatformTrialInfo organization={mockOrganization} />);
};

describe('PlatformTrialInfo', () => {
  beforeEach(() => {
    isOrganizationOnTrial.mockReturnValue(true);
    calcTrialDaysLeft.mockReturnValue(3);
  });

  it('should render nothing if the organization is not on platform trial', () => {
    isOrganizationOnTrial.mockReturnValueOnce(false);
    build();

    expect(screen.queryByTestId('platform-trial-info')).not.toBeInTheDocument();
  });

  it('should render correct information if the organization is on platform trial', () => {
    build();

    const elem = screen.queryByTestId('platform-trial-info');
    expect(elem).toBeInTheDocument();
    expect(elem).toHaveTextContent('Your trial will end in 3 days.');
  });

  it('should handle non-plural form', () => {
    calcTrialDaysLeft.mockReturnValueOnce(1);
    build();

    expect(screen.queryByTestId('platform-trial-info')).toHaveTextContent(
      'Your trial will end in 1 day.'
    );
  });

  it('should handle the trial that ends today', () => {
    calcTrialDaysLeft.mockReturnValueOnce(0);
    build();

    expect(screen.queryByTestId('platform-trial-info')).toHaveTextContent('Your trial ends today.');
  });
});
