import React from 'react';
import { screen, render, waitFor, fireEvent } from '@testing-library/react';

import DeeplinkPage from './DeeplinkPage';
import { resolveLink } from './resolver';
import { getSpaceInfo, getAllEnviroments, getOrgApps } from './utils';
import $state from 'ng/$state';

jest.mock('./utils', () => ({
  getSpaceInfo: jest.fn(),
  getAllEnviroments: jest.fn(),
  getOrgApps: jest.fn(),
}));

jest.mock('./resolver', () => ({
  resolveLink: jest.fn(),
}));

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('deeplink/DeeplinkPage', () => {
  it('should redirect user accoring to resolver response', async () => {
    resolveLink.mockResolvedValue({
      path: 'some.link',
      params: {
        spaceId: '1234',
      },
    });

    const { getByText } = render(
      <DeeplinkPage
        href="https://app.contentful.com"
        marketplaceApps={{}}
        searchParams={{
          link: 'some-link',
          param1: '1',
          param2: '2',
        }}
      />
    );

    expect(resolveLink).toHaveBeenCalledWith('some-link', {
      param1: '1',
      param2: '2',
    });

    await waitFor(() => getByText('Redirecting'));
    await flush();

    expect($state.go).toHaveBeenCalledWith(
      'some.link',
      {
        spaceId: '1234',
      },
      { location: 'replace' }
    );
  });

  it('should show space selection form if resolver returned deeplinkOptions including selectSpace or selectEnv', async function () {
    resolveLink.mockResolvedValue({
      path: 'some.link',
      params: {
        spaceId: '1234',
        app: 'test-app',
      },
      deeplinkOptions: {
        selectSpace: true,
        selectEnvironment: true,
      },
    });

    getSpaceInfo.mockResolvedValue({
      space: { sys: { id: 'current-space' }, name: 'Current space' },
      spaces: [
        {
          sys: { id: 'current-space' },
          name: 'Current space',
          organization: { sys: { id: 'org-1' }, name: 'Organization 1' },
        },
        {
          sys: { id: 'another-space' },
          name: 'Another space',
          organization: { sys: { id: 'org-2' }, name: 'Organization 2' },
        },
      ],
    });

    getAllEnviroments.mockResolvedValue([
      { sys: { id: 'master' }, name: 'master env' },
      { sys: { id: 'test' }, name: 'test env' },
    ]);

    const { getByText, getByTestId } = render(
      <DeeplinkPage
        href="https://app.contentful.com"
        marketplaceApps={{}}
        searchParams={{
          link: 'some-link',
          spaceId: 'deeplink-space-id',
        }}
      />
    );

    expect(resolveLink).toHaveBeenCalledWith('some-link', {
      spaceId: 'deeplink-space-id',
    });

    await waitFor(() => getByTestId('deeplink-select-space'));

    const $inputSpace = getByTestId('deeplink-select-space');
    const $inputEnv = getByTestId('deeplink-select-environment');
    const $proceedButton = getByTestId('deeplink-proceed');

    expect($inputSpace).toHaveValue('current-space');
    expect($inputEnv).toHaveValue('master');
    expect($proceedButton).toBeEnabled();

    fireEvent.change($inputEnv, { target: { value: '' } });

    expect($proceedButton).toBeDisabled();

    fireEvent.change($inputEnv, { target: { value: 'test' } });

    await waitFor(() => expect($proceedButton).toBeEnabled());

    fireEvent.click($proceedButton);

    await waitFor(() => getByText('Redirecting'));

    expect($state.go).toHaveBeenCalledWith(
      'some.link',
      { environmentId: 'test', spaceId: 'current-space', app: 'test-app' },
      { location: 'replace' }
    );
  });

  it('should show app selection form if resolver returned deeplinkOptions including selectApp', async function () {
    const orgId = 'my_org';
    resolveLink.mockResolvedValue({
      path: 'account.organizations',
      params: { orgId },
      deeplinkOptions: {
        selectApp: true,
      },
    });

    const apps = [
      { sys: { id: 'my_boring_app' }, name: 'snooze fest' },
      { sys: { id: 'my_nice_app' }, name: 'My nice app' },
    ];
    getOrgApps.mockResolvedValue(apps);

    const { getByText } = render(
      <DeeplinkPage
        href="https://app.contentful.com"
        searchParams={{
          link: 'some-link',
          spaceId: 'deeplink-space-id',
        }}
        marketplaceApps={{}}
      />
    );

    await waitFor(() => screen.getByTestId('deeplink-select-app'));
    expect(resolveLink).toHaveBeenCalledWith('some-link', {
      spaceId: 'deeplink-space-id',
    });

    const $inputApp = screen.getByTestId('deeplink-select-app');
    const $proceedButton = screen.getByTestId('deeplink-proceed');

    await waitFor(() => expect($proceedButton).toBeDisabled());

    fireEvent.change($inputApp, {
      target: {
        value: $inputApp.querySelector('option:nth-child(3)')?.getAttribute('value'),
      },
    });

    await waitFor(() => expect($proceedButton).toBeEnabled());

    fireEvent.click($proceedButton);

    await waitFor(() => getByText('Redirecting'));
    await flush();

    expect($state.go).toHaveBeenCalledWith(
      'account.organizations',
      { id: apps[1].sys.id, orgId },
      { location: 'replace' }
    );
  });
});
