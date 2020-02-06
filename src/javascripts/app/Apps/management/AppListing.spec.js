import React from 'react';
import { render } from '@testing-library/react';
import AppListing from './AppListing';
import mockDefinitions from './mockData/mockDefinitions.json';

describe('AppListing', () => {
  it('should show the empty state when no definitions are passed', () => {
    expect(render(<AppListing definitions={[]} />)).toMatchSnapshot();
  });

  it('should render the app listing when definitions are present', () => {
    expect(render(<AppListing definitions={mockDefinitions} />)).toMatchSnapshot();
  });
});
