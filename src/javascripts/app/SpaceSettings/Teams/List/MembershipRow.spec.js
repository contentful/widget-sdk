import React from 'react';
import { within, render, fireEvent, getByTestId } from '@testing-library/react';
import { Table, TableBody } from '@contentful/forma-36-react-components';

import { noop } from 'lodash';

import MembershipRow from './MembershipRow';

let onUpdateTeamSpaceMembership;
let onRemoveTeamSpaceMembership;

const build = (props) =>
  render(
    <Table>
      <TableBody>
        <MembershipRow
          {...{
            teamSpaceMembership: {
              admin: false,
              sys: {
                team: {
                  name: 'Team 0',
                  sys: { id: 'team0' },
                },
              },
            },
            teamSpaceMemberships: [],
            spaceMemberships: [],
            availableRoles: [],
            isEditing: false,
            setEditing: noop,
            onUpdateTeamSpaceMembership,
            onRemoveTeamSpaceMembership,
            isPending: false,
            readOnly: false,
            currentUserAdminSpaceMemberships: [],
            ...props,
          }}
        />
      </TableBody>
    </Table>
  );

describe('MembershipRow', () => {
  beforeEach(() => {
    onUpdateTeamSpaceMembership = jest.fn(noop);
    onRemoveTeamSpaceMembership = jest.fn(noop);
  });

  describe('being rendered', () => {
    it('should not break', () => {
      expect(build).not.toThrow();
    });
  });

  describe('teamSpaceMembership with team details is given', () => {
    const teamSpaceMembership = {
      admin: false,
      roles: [
        { name: 'Role 2', sys: { id: 'role2' } },
        { name: 'Role 3', sys: { id: 'role3' } },
      ],
      sys: {
        id: 'membership1',
        team: {
          name: 'Team 1',
          memberCount: 1,
          description: 'This is Team 1',
          sys: { id: 'team1' },
        },
      },
    };

    it('should render teamSpaceMembership and team details', async () => {
      const { findByTestId } = build({ teamSpaceMembership });

      expect(await findByTestId('team.name')).toHaveTextContent('Team 1');
      expect(await findByTestId('team.description')).toHaveTextContent('This is Team 1');
      expect(await findByTestId('member-count-cell')).toHaveTextContent('1 member');
      expect(await findByTestId('roles-cell')).toHaveTextContent('Role 2 and Role 3');
    });

    it('should open / close menu', async () => {
      const { queryByTestId, getByTestId } = build();
      expect(queryByTestId('change-role')).not.toBeInTheDocument();
      fireEvent.click(within(queryByTestId('row-menu')).queryByTestId('cf-ui-icon-button'));
      expect(await getByTestId('change-role')).toBeInTheDocument();
    });

    it('should enter / exit edit mode', async () => {
      expect(
        await build({ isEditing: false }).queryByTestId('space-role-editor.button')
      ).not.toBeInTheDocument();
      expect(
        await build({ isEditing: true }).queryByTestId('space-role-editor.button')
      ).toBeInTheDocument();
    });

    describe('more roles are available', () => {
      const availableRoles = [
        { name: 'Role 1', sys: { id: 'role1' } },
        { name: 'Role 2', sys: { id: 'role2' } },
        { name: 'Role 3', sys: { id: 'role3' } },
        { name: 'Role 4', sys: { id: 'role4' } },
      ];

      it('should show role editor with all available roles in edit mode', async () => {
        const { findAllByTestId, findByTestId } = build({
          teamSpaceMembership,
          isEditing: true,
          availableRoles,
        });

        fireEvent.click(await findByTestId('space-role-editor.button'));
        expect(await findByTestId('space-role-editor.admin-option')).toBeInTheDocument();
        expect(await findAllByTestId('space-role-editor.role-option')).toHaveLength(4);
      });
    });

    it('should delete with confirmation prompt', async () => {
      const { findByTestId, queryByTestId } = build();

      fireEvent.click(within(queryByTestId('row-menu')).queryByTestId('cf-ui-icon-button'));
      fireEvent.click(
        getByTestId(await findByTestId('remove-team'), 'cf-ui-dropdown-list-item-button')
      );

      expect(await findByTestId('remove-team-confirmation')).toBeInTheDocument();

      fireEvent.click(await findByTestId('cf-ui-modal-confirm-confirm-button'));

      expect(onRemoveTeamSpaceMembership).toHaveBeenCalled();
    });

    it('should delete with admin loss confirmation prompt', async () => {
      // suppress jsdom console error
      delete window.location;

      window.location = {
        replace: jest.fn(),
      };

      const lastMembership = {
        admin: true,
        sys: {
          team: {
            name: 'Team 0',
            sys: { id: 'team0' },
          },
          id: 'lastAdminId',
        },
      };

      const { findByTestId, queryByTestId } = build({
        currentUserAdminSpaceMemberships: [lastMembership],
        teamSpaceMembership: lastMembership,
      });

      fireEvent.click(within(queryByTestId('row-menu')).queryByTestId('cf-ui-icon-button'));
      fireEvent.click(
        getByTestId(await findByTestId('remove-team'), 'cf-ui-dropdown-list-item-button')
      );

      const confirmationDialog = await findByTestId('remove-own-admin-confirmation');
      expect(confirmationDialog).toBeInTheDocument();

      fireEvent.change(getByTestId(confirmationDialog, 'cf-ui-text-input'), {
        target: { value: 'I UNDERSTAND' },
      });
      fireEvent.click(await findByTestId('cf-ui-modal-confirm-confirm-button'));

      expect(onRemoveTeamSpaceMembership).toHaveBeenCalled();
    });
  });
});
