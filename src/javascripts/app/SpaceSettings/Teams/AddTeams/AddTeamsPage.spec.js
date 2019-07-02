import React from 'react';
import { render, fireEvent, cleanup, wait } from '@testing-library/react';
import { Notification } from '@contentful/forma-36-react-components';
import { createTeamSpaceMembership } from 'access_control/TeamRepository.es6';
import { go } from 'states/Navigator.es6';
import AddTeamsPage from './AddTeamsPage.es6';

jest.mock('states/Navigator.es6', () => ({
  go: jest.fn().mockResolvedValue(true)
}));

jest.mock('access_control/TeamRepository.es6', () => ({
  createTeamSpaceMembership: jest.fn()
}));

jest.mock('data/EndpointFactory.es6', () => ({
  createSpaceEndpoint: jest.fn()
}));

const mount = ({ teams = [], roles = [] } = {}) => {
  return render(<AddTeamsPage teams={teams} roles={roles} spaceId="space_1234" />);
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

  it('should show the search box on initial load (no interaction)', () => {
    const { queryByTestId } = mount();

    expect(queryByTestId('teams-select')).toBeDefined();
  });

  it('should show the teams and roles lists once a team has been selected', async () => {
    const { queryByTestId } = mount({ teams });

    expect(queryByTestId('teams-and-roles-lists')).toBeNull();
    expect(queryByTestId('submit-button')).toBeNull();

    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_1234' } });

    expect(queryByTestId('teams-and-roles-lists')).toBeDefined();
    expect(queryByTestId('submit-button')).toBeDefined();
  });

  it('should add a team to the list when selected', () => {
    const { queryAllByTestId, queryByTestId } = mount({ teams });

    expect(queryAllByTestId('team')).toHaveLength(0);

    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_1234' } });

    expect(queryAllByTestId('team')).toHaveLength(1);
  });

  it('should remove a team from the list when the X is clicked on the team', () => {
    const { queryAllByTestId, queryByTestId } = mount({ teams });

    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_1234' } });

    expect(queryAllByTestId('team')).toHaveLength(1);

    fireEvent.click(queryByTestId('team_1234-close'));

    expect(queryAllByTestId('team')).toHaveLength(0);
  });

  it('should still display the teams and roles lists if all teams are removed from the list', () => {
    const { queryAllByTestId, queryByTestId } = mount({ teams });

    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_1234' } });
    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_5678' } });

    fireEvent.click(queryByTestId('team_1234-close'));
    fireEvent.click(queryByTestId('team_5678-close'));

    expect(queryAllByTestId('team')).toHaveLength(0);
    expect(queryByTestId('teams-and-roles-lists')).toBeDefined();
    expect(queryByTestId('submit-button')).toBeDefined();
  });

  it('should remove a team that is selected from the select box from the options', () => {
    const { queryByTestId } = mount({ teams });

    expect(queryByTestId('team_1234-option')).toBeDefined();

    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_1234' } });

    expect(queryByTestId('team_1234-option')).toBeNull();
  });

  it('should hide the other roles radio if none are available', () => {
    let helpers;

    helpers = mount({ teams });

    fireEvent.change(helpers.queryByTestId('teams-select'), { target: { value: 'team_1234' } });

    expect(helpers.queryByTestId('RoleSelector__admin_false')).toBeNull();

    cleanup();

    helpers = mount({ teams, roles });

    fireEvent.change(helpers.queryByTestId('teams-select'), { target: { value: 'team_1234' } });

    expect(helpers.queryByTestId('RoleSelector__admin_false')).not.toBeNull();
  });

  it('should disable the submit button if no teams are added', () => {
    const { queryByTestId } = mount({ teams });

    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_1234' } });

    expect(queryByTestId('submit-button').hasAttribute('disabled')).toBeFalse();

    fireEvent.click(queryByTestId('team_1234-close'));

    expect(queryByTestId('submit-button').hasAttribute('disabled')).toBeTrue();
  });

  it('should disable the submit button if non-admin is selected but no role is selected', () => {
    const { queryByTestId, getByText } = mount({ teams, roles });

    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_1234' } });

    expect(queryByTestId('submit-button').hasAttribute('disabled')).toBeFalse();

    fireEvent.click(getByText('Other roles'));

    expect(queryByTestId('submit-button').hasAttribute('disabled')).toBeTrue();
  });

  it('should attempt to add all the teams with the roles via the API when submitted', () => {
    createTeamSpaceMembership.mockResolvedValue(true);

    const { queryByTestId } = mount({ teams });

    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_1234' } });
    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_5678' } });
    fireEvent.click(queryByTestId('submit-button'));

    expect(createTeamSpaceMembership).toHaveBeenCalledTimes(2);
  });

  it('should display a success notification and navigate if all teams were successfully added', async () => {
    createTeamSpaceMembership.mockResolvedValue(true);

    const { queryByTestId } = mount({ teams });

    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_1234' } });
    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_5678' } });
    fireEvent.click(queryByTestId('submit-button'));

    await wait();

    expect(notificationSuccessSpy).toHaveBeenCalledTimes(1);
    expect(go).toHaveBeenCalledTimes(1);
  });

  it('should display both success and error notifications and navigate if a partial failure occurred', async () => {
    createTeamSpaceMembership.mockResolvedValueOnce();
    createTeamSpaceMembership.mockRejectedValue();

    const { queryByTestId } = mount({ teams });

    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_1234' } });
    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_5678' } });
    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_0987' } });
    fireEvent.click(queryByTestId('submit-button'));

    await wait();

    expect(notificationSuccessSpy).toHaveBeenCalledTimes(1);
    expect(notificationErrorSpy).toHaveBeenCalledTimes(2);
    expect(go).toHaveBeenCalledTimes(1);
  });

  it('should display error notification and not navigate if a total failure occurred', async () => {
    createTeamSpaceMembership.mockRejectedValue();

    const { queryByTestId } = mount({ teams });

    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_1234' } });
    fireEvent.change(queryByTestId('teams-select'), { target: { value: 'team_5678' } });
    fireEvent.click(queryByTestId('submit-button'));

    await wait();

    expect(notificationSuccessSpy).not.toHaveBeenCalled();
    expect(go).not.toHaveBeenCalled();
    expect(notificationErrorSpy).toHaveBeenCalledTimes(1);
  });
});
