import React from 'react';
import { render, fireEvent, cleanup, wait, within } from '@testing-library/react';
import { Notification } from '@contentful/forma-36-react-components';
import { createTeamSpaceMembership } from 'access_control/TeamRepository.es6';
import { go } from 'states/Navigator.es6';
import AddTeamsPage from './AddTeamsPage.es6';

import 'jest-dom/extend-expect';

jest.mock('states/Navigator.es6', () => ({
  go: jest.fn().mockResolvedValue(true)
}));

jest.mock('access_control/TeamRepository.es6', () => ({
  createTeamSpaceMembership: jest.fn()
}));

jest.mock('data/EndpointFactory.es6', () => ({
  createSpaceEndpoint: jest.fn()
}));

const mount = ({ teams = [], roles = [], teamSpaceMemberships = [] } = {}) => {
  return render(
    <AddTeamsPage
      teams={teams}
      roles={roles}
      teamSpaceMemberships={teamSpaceMemberships}
      spaceId="space_1234"
    />
  );
};

const teams = [
  {
    name: 'Test team',
    sys: {
      id: 'team_1234'
    }
  },
  {
    name: 'Awesome other team',
    sys: {
      id: 'team_5678'
    }
  },
  {
    name: 'Third team',
    sys: {
      id: 'team_0987'
    }
  }
];

const roles = [
  {
    name: 'Author',
    sys: {
      id: 'role_1234'
    }
  },
  {
    name: 'Awesome custom role',
    sys: {
      id: 'role_5678'
    }
  }
];

const searchAndSelectTeam = (teamName, { queryByTestId }) => {
  fireEvent.keyDown(queryByTestId('autocomplete.input'), { keyCode: 40 });
  fireEvent.change(queryByTestId('autocomplete.input'), { target: { value: teamName } });

  const option = queryByTestId('autocomplete.dropdown-list-item');
  const button = within(option).getByTestId('cf-ui-dropdown-list-item-button');

  fireEvent.click(button);
};

const getAutocompleteOptions = ({ queryByTestId, queryAllByTestId }) => {
  fireEvent.keyDown(queryByTestId('autocomplete.input'), { keyCode: 40 });
  return queryAllByTestId('autocomplete.dropdown-list-item');
};

describe('AddTeamsPage', () => {
  let notificationErrorSpy;
  let notificationSuccessSpy;

  beforeEach(() => {
    notificationErrorSpy = jest.spyOn(Notification, 'error').mockImplementation(() => {});
    notificationSuccessSpy = jest.spyOn(Notification, 'success').mockImplementation(() => {});
  });

  afterEach(() => {
    createTeamSpaceMembership.mockReset();
    go.mockReset();

    notificationSuccessSpy.mockRestore();
    notificationErrorSpy.mockRestore();
  });

  afterEach(cleanup);

  it('should show the search box on initial load (at least one team, no interaction)', () => {
    const { queryByTestId } = mount({ teams: [{ sys: { id: 'team1' }, name: 'Team 1' }] });

    expect(queryByTestId('autocomplete.input')).toBeVisible();
  });

  it('should show the teams and roles lists once a team has been selected', async () => {
    const { queryByTestId } = mount({ teams });

    expect(queryByTestId('teams-and-roles-lists')).toBeNull();
    expect(queryByTestId('submit-button')).toBeNull();

    searchAndSelectTeam('Test team', { queryByTestId });

    expect(queryByTestId('teams-and-roles-lists')).toBeVisible();
    expect(queryByTestId('submit-button')).toBeVisible();
  });

  it('should add a team to the list when selected', () => {
    const { queryAllByTestId, queryByTestId } = mount({ teams });

    expect(queryAllByTestId('team-in-list')).toHaveLength(0);

    searchAndSelectTeam('Test team', { queryByTestId });

    expect(queryAllByTestId('team-in-list')).toHaveLength(1);
  });

  it('should remove a team from the list when the X is clicked on the team', () => {
    const { queryAllByTestId, queryByTestId } = mount({ teams });

    searchAndSelectTeam('Test team', { queryByTestId });

    expect(queryAllByTestId('team-in-list')).toHaveLength(1);

    fireEvent.click(queryByTestId('team-in-list.close'));

    expect(queryAllByTestId('team-in-list')).toHaveLength(0);
  });

  it('should still display the teams and roles lists if all teams are removed from the list', () => {
    const { queryAllByTestId, queryByTestId } = mount({ teams });

    searchAndSelectTeam('Test team', { queryByTestId });
    searchAndSelectTeam('Awesome other team', { queryByTestId });

    fireEvent.click(queryAllByTestId('team-in-list.close')[0]);
    fireEvent.click(queryAllByTestId('team-in-list.close')[0]);

    expect(queryAllByTestId('team')).toHaveLength(0);
    expect(queryByTestId('teams-and-roles-lists')).toBeVisible();
    expect(queryByTestId('submit-button')).toBeVisible();
  });

  it('should remove a team that is selected from the select box from the options', () => {
    const { queryByTestId, queryAllByTestId } = mount({ teams });

    let options;

    options = getAutocompleteOptions({ queryByTestId, queryAllByTestId });

    expect(options).toHaveLength(3);

    searchAndSelectTeam('Test team', { queryByTestId });

    options = getAutocompleteOptions({ queryByTestId, queryAllByTestId });

    expect(options).toHaveLength(2);
  });

  it('should hide the other roles radio if none are available', () => {
    let helpers;

    helpers = mount({ teams });

    searchAndSelectTeam('Test team', { queryByTestId: helpers.queryByTestId });

    expect(helpers.queryByTestId('RoleSelector.admin_false')).toBeNull();

    cleanup();

    helpers = mount({ teams, roles });

    searchAndSelectTeam('Test team', { queryByTestId: helpers.queryByTestId });

    expect(helpers.queryByTestId('RoleSelector.admin_false')).not.toBeNull();
  });

  it('should disable the submit button if no teams are added', () => {
    const { queryByTestId } = mount({ teams });

    searchAndSelectTeam('Test team', { queryByTestId });

    expect(queryByTestId('submit-button').hasAttribute('disabled')).toBeFalse();

    fireEvent.click(queryByTestId('team-in-list.close'));

    expect(queryByTestId('submit-button').hasAttribute('disabled')).toBeTrue();
  });

  it('should disable the submit button if non-admin is selected but no role is selected', () => {
    const { queryByTestId, getByText } = mount({ teams, roles });

    searchAndSelectTeam('Test team', { queryByTestId });

    expect(queryByTestId('submit-button').hasAttribute('disabled')).toBeFalse();

    fireEvent.click(getByText('Other roles'));

    expect(queryByTestId('submit-button').hasAttribute('disabled')).toBeTrue();
  });

  it('should attempt to add all the teams with the roles via the API when submitted', () => {
    createTeamSpaceMembership.mockResolvedValue(true);

    const { queryByTestId } = mount({ teams });

    searchAndSelectTeam('Test team', { queryByTestId });
    searchAndSelectTeam('Awesome other team', { queryByTestId });

    fireEvent.click(queryByTestId('submit-button'));

    expect(createTeamSpaceMembership).toHaveBeenCalledTimes(2);
  });

  it('should display a success notification and navigate if all teams were successfully added', async () => {
    createTeamSpaceMembership.mockResolvedValue(true);

    const { queryByTestId } = mount({ teams });

    searchAndSelectTeam('Test team', { queryByTestId });
    searchAndSelectTeam('Awesome other team', { queryByTestId });

    fireEvent.click(queryByTestId('submit-button'));

    await wait();

    expect(notificationSuccessSpy).toHaveBeenCalledTimes(1);
    expect(go).toHaveBeenCalledTimes(1);
  });

  it('should display both success and error notifications and navigate if a partial failure occurred', async () => {
    createTeamSpaceMembership.mockResolvedValueOnce();
    createTeamSpaceMembership.mockRejectedValue();

    const { queryByTestId } = mount({ teams });

    searchAndSelectTeam('Test team', { queryByTestId });
    searchAndSelectTeam('Awesome other team', { queryByTestId });
    searchAndSelectTeam('Third team', { queryByTestId });

    fireEvent.click(queryByTestId('submit-button'));

    await wait();

    expect(notificationSuccessSpy).toHaveBeenCalledTimes(1);
    expect(notificationErrorSpy).toHaveBeenCalledTimes(2);
    expect(go).toHaveBeenCalledTimes(1);
  });

  it('should display error notification and not navigate if a total failure occurred', async () => {
    createTeamSpaceMembership.mockRejectedValue();

    const { queryByTestId } = mount({ teams });

    searchAndSelectTeam('Test team', { queryByTestId });
    searchAndSelectTeam('Awesome other team', { queryByTestId });

    fireEvent.click(queryByTestId('submit-button'));

    await wait();

    expect(notificationSuccessSpy).not.toHaveBeenCalled();
    expect(go).not.toHaveBeenCalled();
    expect(notificationErrorSpy).toHaveBeenCalledTimes(1);
  });
});
