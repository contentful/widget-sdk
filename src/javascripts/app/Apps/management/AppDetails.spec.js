import React from 'react';
import { render, wait, cleanup, fireEvent } from '@testing-library/react';
import AppDetails from './AppDetails';
import mockDefinitions from './mockData/mockDefinitions.json';
import * as ManagementApiClient from './ManagementApiClient';
import * as util from './util';
jest.mock('access_control/OrganizationMembershipRepository');
jest.mock('./ManagementApiClient');
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

ManagementApiClient.getCreatorNameOf = jest.fn(() => Promise.resolve('John Smith'));

describe('AppDetails', () => {
  afterEach(cleanup);

  it('should show the details of an app with the provided definition', async () => {
    const definition = mockDefinitions[0];
    const wrapper = render(<AppDetails definition={definition} goToListView={() => {}} />);
    await wait();

    // should not show the public switch
    expect(() => wrapper.getByTestId('public-switch')).toThrow();
    expect(wrapper).toMatchSnapshot();
  });

  it('should show the public toggle for the APPS_PUBLIC_ORG', async () => {
    const definition = mockDefinitions[1];
    const wrapper = render(<AppDetails definition={definition} goToListView={() => {}} />);
    await wait();

    expect(wrapper).toMatchSnapshot();
  });

  it('should update and save the definition', async () => {
    const definition = mockDefinitions[1];
    const { getByTestId, getAllByTestId } = render(
      <AppDetails definition={definition} goToListView={() => {}} />
    );

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
