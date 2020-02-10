import React from 'react';
import { render, wait, cleanup, fireEvent } from '@testing-library/react';
import AppInstallModal from './AppInstallModal';
import * as util from './util';
import * as Navigator from 'states/Navigator';
import mockDefinitions from './mockData/mockDefinitions.json';

jest.mock('./util');

jest.mock('states/Navigator', () => ({
  go: jest.fn()
}));

util.getOrgsAndSpaces = jest.fn(() =>
  Promise.resolve([
    {
      org: { sys: { id: 'my-org-123' } },
      spaces: [
        {
          name: 'mySpace',
          sys: { id: 'my-space-123' },
          organization: { sys: { id: 'my-org-123' } }
        }
      ]
    },
    {
      org: { sys: { id: 'my-org-123' } },
      spaces: [
        {
          name: 'myOtherSpace',
          sys: { id: 'my-other-space-123' },
          organization: { sys: { id: 'my-org-123' } }
        }
      ]
    }
  ])
);

util.getEnvsFor = jest.fn(() =>
  Promise.resolve([
    { name: 'my-env', sys: { id: 'my-env-123' } },
    { name: 'my-other-env', sys: { id: 'my-other-env-123' } }
  ])
);

util.getLastUsedSpace = jest.fn(() => 'my-space-123');

describe('AppInstallModal', () => {
  beforeEach(() => {});

  afterEach(cleanup);

  it('should render the last used space and first env on load and be able to install right away', async () => {
    const wrapper = render(<AppInstallModal definition={mockDefinitions[0]} onClose={() => {}} />);
    await wait();

    expect(wrapper).toMatchSnapshot();

    wrapper.getByTestId('continue-button').click();

    expect(Navigator.go).toHaveBeenCalledWith({
      options: { location: 'replace' },
      params: {
        appId: 'private_3AjEyjWz5tRouW4cVOF9la',
        environmentId: 'my-env-123',
        referrer: 'app-management',
        spaceId: 'my-space-123'
      },
      path: 'spaces.detail.environment.apps.detail'
    });
  });

  it('should be able to pick a different space and env and install', async () => {
    const wrapper = render(<AppInstallModal definition={mockDefinitions[0]} onClose={() => {}} />);
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
        appId: 'private_3AjEyjWz5tRouW4cVOF9la',
        environmentId: 'my-other-env-123',
        referrer: 'app-management',
        spaceId: 'my-other-space-123'
      },
      path: 'spaces.detail.environment.apps.detail'
    });
  });
});
