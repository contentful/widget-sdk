import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react';
import NewApp from './NewApp';
import * as ManagementApiClient from './ManagementApiClient';

ManagementApiClient.save = jest.fn();

describe('NewApp', () => {
  it('should allow for new app creation', async () => {
    const wrapper = render(
      <NewApp orgId="org-123" goToListView={() => {}} goToDefinition={() => {}} />
    );

    const [nameInput, srcInput] = wrapper.getAllByTestId('cf-ui-text-input');
    const appLocation = wrapper.getByTestId('app-location-app-config');

    fireEvent.change(nameInput, { target: { value: 'my first test app' } });
    fireEvent.change(srcInput, { target: { value: 'http://localhost:1234' } });
    appLocation.click();

    const createButton = wrapper.getByTestId('app-create');

    createButton.click();

    await wait();

    expect(ManagementApiClient.save.mock.calls[0]).toMatchSnapshot();

    expect(wrapper).toMatchSnapshot();
  });
});
