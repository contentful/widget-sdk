import React from 'react';
import { render, wait, fireEvent } from '@testing-library/react';
import { AppInstallModal } from './AppInstallModal';
import * as Navigator from 'states/Navigator';
import mockDefinitions from './__mocks__/mockDefinitions.json';
import { AppDefinition } from 'contentful-management/types';
import { noop } from 'lodash';

jest.mock('./util', () => ({
  getOrgSpacesFor: jest.fn(() =>
    Promise.resolve([
      {
        name: 'mySpace',
        sys: { id: 'my-space-123' },
        organization: { sys: { id: 'my-org-123' } },
      },
      {
        name: 'myOtherSpace',
        sys: { id: 'my-other-space-123' },
        organization: { sys: { id: 'my-org-123' } },
      },
    ])
  ),

  getEnvsFor: jest.fn(() =>
    Promise.resolve([
      { name: 'my-env', sys: { id: 'my-env-123' } },
      { name: 'my-other-env', sys: { id: 'my-other-env-123' } },
    ])
  ),

  getLastUsedSpace: jest.fn(() => 'my-space-123'),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(() => Promise.resolve()),
}));

describe('AppInstallModal', () => {
  it('should render the last used space and first env on load and be able to install right away', async () => {
    const wrapper = render(
      <AppInstallModal isShown definition={mockDefinitions[0] as AppDefinition} onClose={noop} />
    );
    await wait();

    expect(wrapper).toMatchSnapshot();

    wrapper.getByTestId('continue-button').click();

    expect(Navigator.go).toHaveBeenCalledWith({
      options: { location: 'replace' },
      params: {
        appId: '3AjEyjWz5tRouW4cVOF9la',
        environmentId: 'my-env-123',
        referrer: 'app-management',
        spaceId: 'my-space-123',
      },
      path: 'spaces.detail.environment.apps.detail',
    });
  });

  it('should be able to pick a different space and env and install', async () => {
    const wrapper = render(
      <AppInstallModal isShown definition={mockDefinitions[0] as AppDefinition} onClose={noop} />
    );
    await wait();

    const [spaceSelector, envSelector] = wrapper.getAllByTestId('cf-ui-select');

    fireEvent.change(spaceSelector, { target: { value: 'my-other-space-123' } });
    await wait();
    fireEvent.change(envSelector, { target: { value: 'my-other-env-123' } });
    await wait();

    wrapper.getByTestId('continue-button').click();

    expect(Navigator.go).toHaveBeenCalledWith({
      options: { location: 'replace' },
      params: {
        appId: '3AjEyjWz5tRouW4cVOF9la',
        environmentId: 'my-other-env-123',
        referrer: 'app-management',
        spaceId: 'my-other-space-123',
      },
      path: 'spaces.detail.environment.apps.detail',
    });
  });
});
