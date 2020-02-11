import React from 'react';
import { render } from '@testing-library/react';
import AppListing from './AppListing';
import * as util from './util';
import mockDefinitions from './mockData/mockDefinitions.json';
jest.mock('./util');

util.getOrgSpacesFor = jest.fn(() =>
  Promise.resolve([
    {
      name: 'mySpace',
      sys: { id: 'my-space-123' },
      organization: { sys: { id: 'my-org-123' } }
    }
  ])
);

util.getEnvsFor = jest.fn(() => Promise.resolve([{ name: 'my-env', sys: { id: 'my-env-123' } }]));

util.getLastUsedSpace = jest.fn(() => Promise.resolve('my-space-123'));

describe('AppListing', () => {
  it('should show the empty state when no definitions are passed', () => {
    expect(render(<AppListing definitions={[]} />)).toMatchSnapshot();
  });

  it('should render the app listing when definitions are present', () => {
    expect(render(<AppListing definitions={mockDefinitions} />)).toMatchSnapshot();
  });
});
