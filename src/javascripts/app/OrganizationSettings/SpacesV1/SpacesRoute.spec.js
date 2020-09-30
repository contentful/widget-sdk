import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import SpacesRoute from './SpacesRoute';
import moment from 'moment';
import { getAllSpaces } from 'access_control/OrganizationMembershipRepository';
import createResourceService from 'services/ResourceService';
import { openDeleteSpaceDialog } from 'features/space-settings';
import { beginSpaceCreation } from 'services/CreateSpace';
import { getSpaces } from 'services/TokenStore';
import { go } from 'states/Navigator';
import * as FORMA_CONSTANTS from 'test/helpers/Forma36Constants';
import * as fake from 'test/helpers/fakeFactory';

const DEFAULT_CREATED_AT_STRING = '2020-05-07T10:48:53Z';
const CREATED_AT_FROM_NOW = moment(DEFAULT_CREATED_AT_STRING).fromNow();
const CREATED_AT_FULL_FORMAT = 'Thursday, May 7, 2020 10:48 AM';
const USER_COUNT = 2;
const ENTRY_COUNT = 1;
const REQUEST_COUNT = 10;
const fakeSpace1 = fake.Space({ sys: fake.sys({ createdAt: DEFAULT_CREATED_AT_STRING }) });
const fakeSpace2 = fake.Space({ sys: fake.sys({ createdAt: DEFAULT_CREATED_AT_STRING }) });
const fakeResources = [
  { sys: { id: 'space_membership' }, usage: USER_COUNT },
  { sys: { id: 'entry' }, usage: ENTRY_COUNT },
  { sys: { id: 'content_delivery_api_request' }, usage: REQUEST_COUNT },
];

jest.mock('access_control/OrganizationMembershipRepository', () => ({
  getAllSpaces: jest.fn(),
}));

jest.mock('services/ResourceService', () => {
  const service = {
    getAll: jest.fn(),
  };

  return () => service;
});

jest.mock('features/space-settings', () => ({
  openDeleteSpaceDialog: jest.fn(({ onSuccess }) => onSuccess()),
}));

jest.mock('services/CreateSpace', () => ({
  beginSpaceCreation: jest.fn(),
}));

jest.mock('services/TokenStore', () => ({
  getSpaces: jest.fn(),
}));

jest.mock('states/Navigator', () => ({
  go: jest.fn(),
}));

const build = async () => {
  render(<SpacesRoute />);

  return waitFor(() => expect(getAllSpaces).toHaveBeenCalled());
};

describe('SpacesRoute', () => {
  describe('it renders loading state', () => {
    it('should show an loading icon when waiting for data fetch', async () => {
      const loading = build();

      expect(screen.getByTestId('cf-ui-loading-state')).toBeVisible();

      await loading;

      expect(screen.queryByTestId('cf-ui-loading-state')).toBeNull();
    });
  });

  describe('it renders with errors', () => {
    it('should render an error if fetching the space data fails', async () => {
      getAllSpaces.mockReset().mockRejectedValue(new Error());

      await build();

      expect(screen.queryByTestId('cf-ui-error-state')).toBeVisible();
    });

    it('should render an error if fetching the resource data fails', async () => {
      createResourceService().getAll.mockReset().mockRejectedValue(new Error());

      await build();

      expect(screen.queryByTestId('cf-ui-error-state')).toBeVisible();
    });
  });

  describe('it renders with no spaces', () => {
    beforeEach(() => {
      getAllSpaces.mockReset().mockReturnValue([]);
      getSpaces.mockReset().mockReturnValue([]);
    });

    it('should not call resource service', async () => {
      await build();

      expect(getAllSpaces).toHaveBeenCalled();
      expect(createResourceService().getAll).not.toHaveBeenCalled();
    });

    it('should render empty space home when there are no spaces', async () => {
      await build();

      expect(screen.queryByTestId('cf-ui-empty-space-admin')).toBeVisible();
    });
  });

  describe('it renders spaces', () => {
    beforeEach(() => {
      getAllSpaces.mockReset().mockReturnValue([fakeSpace1, fakeSpace2]);

      createResourceService().getAll.mockReset().mockReturnValue(fakeResources);

      getSpaces.mockReset().mockReturnValue([fakeSpace1, fakeSpace2]);
    });

    it('should fetch space and resource data when the component renders', async () => {
      await build();

      expect(getAllSpaces).toHaveBeenCalled();
      expect(getSpaces).toBeCalled();
      expect(createResourceService().getAll).toHaveBeenCalled();
    });

    it('should not break', async () => {
      await expect(build()).resolves.not.toThrow();
    });

    it('should render the workbench header title', async () => {
      await build();

      expect(screen.getByTestId('v1-spaces-list.title')).toHaveTextContent('Organization spaces');
    });

    it('should render the "New space" button', async () => {
      await build();

      expect(screen.getByTestId('v1-spaces-list.new-space-button')).toHaveTextContent('New space');
    });

    it('should render the correct table headers', async () => {
      await build();

      expect(screen.getByTestId('v1-spaces-header.name')).toHaveTextContent('Name');
      expect(screen.getByTestId('v1-spaces-header.user')).toHaveTextContent('Users');
      expect(screen.getByTestId('v1-spaces-header.entry')).toHaveTextContent('Entries');
      expect(screen.getByTestId('v1-spaces-header.cda-request')).toHaveTextContent('CDA requests');
      expect(screen.getByTestId('v1-spaces-header.created-at')).toHaveTextContent('Created at');
    });

    it('should render two rows', async () => {
      await build();

      const rows = screen.queryAllByTestId('v1-space-row');
      expect(rows).toHaveLength(2);

      const firstRow = rows[0];
      expect(within(firstRow).queryByTestId('v1-space-row.name')).toHaveTextContent(
        fakeSpace1.name
      );
      expect(within(firstRow).queryByTestId('v1-space-row.user')).toHaveTextContent(USER_COUNT);
      expect(within(firstRow).queryByTestId('v1-space-row.entry')).toHaveTextContent(ENTRY_COUNT);
      expect(within(firstRow).queryByTestId('v1-space-row.cda-request')).toHaveTextContent(
        REQUEST_COUNT
      );
      expect(within(firstRow).queryByTestId('v1-space-row.created-at')).toHaveTextContent(
        CREATED_AT_FROM_NOW
      ); // i.e. 3 months ago
      expect(within(firstRow).queryByTestId('v1-spaces-row.dropdown-menu.trigger')).toBeVisible();
    });

    it('should show a datetime when the created_at cell is hovered', async () => {
      await build();

      const createdAtCell = screen.queryAllByTestId('v1-space-row.created-at')[0];

      fireEvent.mouseOver(createdAtCell.firstElementChild);
      const tooltip = screen.getByTestId('v1-space-created-at-tooltip');

      expect(tooltip).toBeVisible();
      expect(tooltip).toHaveTextContent(CREATED_AT_FULL_FORMAT);
    });
  });

  describe('it deletes a space', () => {
    it('should open a delete space modal', async () => {
      await build();

      const actionIcon = screen.queryAllByTestId('v1-spaces-row.dropdown-menu.trigger')[0];
      fireEvent.click(actionIcon);
      const deleteContainer = screen.queryByTestId('v1-spaces-dropdown-item.delete-space');
      fireEvent.click(within(deleteContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID));

      expect(openDeleteSpaceDialog).toHaveBeenCalled();
    });

    it('should render an updated list', async () => {
      await build();

      expect(screen.queryAllByTestId('v1-space-row')).toHaveLength(2);

      fireEvent.click(screen.queryAllByTestId('v1-spaces-row.dropdown-menu.trigger')[0]);
      const deleteContainer = screen.queryByTestId('v1-spaces-dropdown-item.delete-space');
      fireEvent.click(within(deleteContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID));

      const updatedRows = screen.queryAllByTestId('v1-space-row');
      expect(updatedRows).toHaveLength(1);
      expect(within(updatedRows[0]).queryByTestId('v1-space-row.name')).toHaveTextContent(
        fakeSpace2.name
      );
    });
  });

  describe('it creates a space', () => {
    it('should open a create space modal', async () => {
      await build();

      fireEvent.click(screen.getByTestId('v1-spaces-list.new-space-button'));

      expect(beginSpaceCreation).toHaveBeenCalled();
    });
  });

  describe('it navigates to a space home', () => {
    const goToSpaceHome = (iconElm) => {
      fireEvent.click(iconElm); // open the action dropdown
      const goToSpaceContainer = screen.queryByTestId('v1-spaces-dropdown-item.go-to-space');
      fireEvent.click(
        within(goToSpaceContainer).getByTestId(FORMA_CONSTANTS.DROPDOWN_BUTTON_TEST_ID)
      );
    };

    it('should navigate to space home if it is accessible to the user', async () => {
      // fakeSpace1 is not accessible
      getSpaces.mockReset().mockReturnValue([fakeSpace2]);
      await build();

      const actionIcons = screen.queryAllByTestId('v1-spaces-row.dropdown-menu.trigger');

      goToSpaceHome(actionIcons[0]);
      expect(go).not.toHaveBeenCalled();

      goToSpaceHome(actionIcons[1]);
      expect(go).toHaveBeenCalledWith({
        path: ['spaces', 'detail', 'home'],
        params: { spaceId: fakeSpace2.sys.id },
        options: { reload: true },
      });
    });
  });
});
