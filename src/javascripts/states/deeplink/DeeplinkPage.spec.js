import React from 'react';
import { render, cleanup, waitForElement, fireEvent } from '@testing-library/react';
import 'jest-dom/extend-expect';
import DeeplinkPage from './DeeplinkPage';
import { resolveLink } from './resolver.es6';
import { getSpaceInfo, getAllEnviroments } from './utils.es6';
import $state from 'ng/$state';

jest.mock('./utils', () => ({
  getSpaceInfo: jest.fn(),
  getAllEnviroments: jest.fn()
}));

jest.mock(
  './resolver.es6',
  () => ({
    resolveLink: jest.fn()
  }),
  { virtual: true }
);

describe('deeplink/DeeplinkPage', () => {
  beforeEach(() => {
    $state.go.mockClear();
  });

  afterEach(cleanup);

  it('should redirect user accoring to resolver response', async () => {
    resolveLink.mockResolvedValue({
      path: ['spaces', 'detail', 'environment', 'apps', 'list'],
      params: {
        spaceId: '1234'
      }
    });

    const { getByText } = render(
      <DeeplinkPage
        href="https://app.contentful.com"
        searchParams={{
          link: 'some-link',
          param1: '1',
          param2: '2'
        }}
      />
    );

    expect(resolveLink).toHaveBeenCalledWith('some-link', {
      param1: '1',
      param2: '2'
    });

    await waitForElement(() => getByText('Redirecting…'));

    expect($state.go).toHaveBeenCalledWith(
      'spaces.detail.environment.apps.list',
      {
        spaceId: '1234'
      },
      { location: 'replace' }
    );
  });

  it('should show space selection form if resolver returned deeplinkOptions', async function() {
    resolveLink.mockResolvedValue({
      path: ['spaces', 'detail', 'environment', 'apps', 'list'],
      params: {
        spaceId: '1234'
      },
      deeplinkOptions: {
        selectSpace: true,
        selectEnvironment: true
      }
    });

    getSpaceInfo.mockResolvedValue({
      space: { sys: { id: 'current-space' }, name: 'Current space' },
      spaces: [
        {
          sys: { id: 'current-space' },
          name: 'Current space',
          organization: { sys: { id: 'org-1' }, name: 'Organization 1' }
        },
        {
          sys: { id: 'another-space' },
          name: 'Another space',
          organization: { sys: { id: 'org-2' }, name: 'Organization 2' }
        }
      ]
    });

    getAllEnviroments.mockResolvedValue([
      { sys: { id: 'master' }, name: 'master env' },
      { sys: { id: 'test' }, name: 'test env' }
    ]);

    const { getByText, getByTestId } = render(
      <DeeplinkPage
        href="https://app.contentful.com"
        searchParams={{
          link: 'some-link',
          spaceId: 'deeplink-space-id'
        }}
      />
    );

    expect(resolveLink).toHaveBeenCalledWith('some-link', {
      param1: '1',
      param2: '2'
    });

    await waitForElement(() => getByTestId('deeplink-select-space'));

    const $inputSpace = getByTestId('deeplink-select-space');
    const $inputEnv = getByTestId('deeplink-select-environment');
    const $proceedButton = getByTestId('deeplink-proceed');

    expect($inputSpace).toHaveValue('current-space');
    expect($inputEnv).toHaveValue('master');
    expect($proceedButton).toBeEnabled();

    fireEvent.change($inputEnv, { target: { value: '' } });

    expect($proceedButton).toBeDisabled();

    fireEvent.change($inputEnv, { target: { value: 'test' } });

    fireEvent.click($proceedButton);

    waitForElement(() => getByText('Redirecting...'));

    expect($state.go).toHaveBeenCalledWith(
      'spaces.detail.environment.apps.list',
      { environmentId: 'test', spaceId: 'current-space' },
      { location: 'replace' }
    );
  });
});
