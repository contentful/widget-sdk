import React from 'react';
import { render, cleanup } from '@testing-library/react';
import AppInstallModal from './AppInstallModal';
import TokenStore from 'services/TokenStore';
import EndpointFactory from 'data/EndpointFactory';
import SpaceEnvironmentRepo from 'data/CMA/SpaceEnvironmentsRepo';
import browserStore from 'browserStorage';
import * as Navigator from 'states/Navigator';
import mockDefinitions from './mockData/mockDefinitions.json';
jest.mock('services/TokenStore');
jest.mock('data/EndpointFactory');
jest.mock('data/CMA/SpaceEnvironmentsRepo');
jest.mock('browserStorage');
jest.mock('states/Navigator');

TokenStore.getSpaces = jest.fn();
TokenStore.getOrganizations = jest.fn();
EndpointFactory.createSpaceEndpoint = jest.fn();
SpaceEnvironmentRepo.create = jest.fn();
browserStore.getStore = jest.fn(() => {
  return {
    forKey: jest.fn,
    get: jest.fn
  };
});
Navigator.go = jest.fn();

describe('AppInstallModal', () => {
  beforeEach(() => {});

  afterEach(cleanup);

  it('should render null if no definition is passed', () => {
    expect(render(<AppInstallModal definition={null} onClose={() => {}} />)).toBeNull();
  });

  it('should render the last used space and first env on load', async () => {
    const wrapper = render(<AppInstallModal definition={mockDefinitions[0]} onClose={() => {}} />);

    wrapper.debug();
  });
});
