import React from 'react';
import { render, wait, cleanup, fireEvent } from '@testing-library/react';
import AppDetails from './AppDetails';
import mockDefinitions from './mockData/mockDefinitions.json';
import * as accessControls from 'access_control/OrganizationMembershipRepository';
import * as ManagementApiClient from './ManagementApiClient';
import * as util from './util';
jest.mock('access_control/OrganizationMembershipRepository');
jest.mock('./ManagementApiClient');
jest.mock('./util');

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
    }
  ])
);

util.getEnvsFor = jest.fn(() => Promise.resolve([{ name: 'my-env', sys: { id: 'my-env-123' } }]));

util.getLastUsedSpace = jest.fn(() => Promise.resolve('my-space-123'));

accessControls.getUser = jest.fn(() => ({ firstName: 'John', lastName: 'Smith' }));

describe('AppDetails', () => {
  afterEach(cleanup);

  it('should show the details of an app with the provided definition', async () => {
    const definition = mockDefinitions[0];
    const wrapper = render(<AppDetails definition={definition} />);
    await wait();

    // should not show the public switch
    expect(() => wrapper.getByTestId('public-switch')).toThrow();

    // should get the user name from the userId
    expect(accessControls.getUser).toHaveBeenCalledWith(undefined, '5NY5T2MqqnqTlRlJ022S9m');
    expect(wrapper).toMatchSnapshot();
  });

  it('should show the public toggle for the APPS_PUBLIC_ORG', async () => {
    const definition = mockDefinitions[1];
    const wrapper = render(<AppDetails definition={definition} />);
    await wait();

    expect(wrapper).toMatchSnapshot();
  });

  it('should update and save the definition', async () => {
    const definition = mockDefinitions[1];
    const { getByTestId, getAllByTestId } = render(<AppDetails definition={definition} />);

    const saveButton = getByTestId('app-save');
    const [nameInput, srcInput] = getAllByTestId('cf-ui-text-input');
    const appConfigCheck = getByTestId('app-location-app-config');

    // click save without changes
    // should send over the unchanged definition data
    saveButton.click();
    expect(ManagementApiClient.save.mock.calls[0][0]).toEqual(definition);

    await wait();

    // change the name of the app
    fireEvent.change(nameInput, { target: { value: 'Jira Version 2' } });
    // change the src of the app
    fireEvent.change(srcInput, { target: { value: 'Jira Version 2' } });
    // remove the app config location
    appConfigCheck.click();

    await wait();

    saveButton.click();

    // should send over the updated definition data
    expect(ManagementApiClient.save.mock.calls[1][0]).toMatchSnapshot();
  });

  it.todo('should pop the app delete definition modal');
  it.todo('should pop the app installation modal');
});
