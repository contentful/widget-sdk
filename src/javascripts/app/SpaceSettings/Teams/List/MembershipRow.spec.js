import React from 'react';
import { cleanup, render, fireEvent } from '@testing-library/react';
import { Table, TableBody } from '@contentful/forma-36-react-components';
import 'jest-dom/extend-expect';
import { noop } from 'lodash';

import MembershipRow from './MembershipRow.es6';

const build = props =>
  render(
    <Table>
      <TableBody>
        <MembershipRow
          {...{
            membership: {
              admin: false,
              sys: {
                team: {
                  name: 'Team 0',
                  sys: { id: 'team0' }
                }
              }
            },
            availableRoles: [],
            menuIsOpen: false,
            setMenuOpen: noop,
            isEditing: false,
            setEditing: noop,
            onUpdateTeamSpaceMembership: noop,
            onRemoveTeamSpaceMembership: noop,
            isPending: false,
            readOnly: false,
            currentUserAdminSpaceMemberships: [],
            ...props
          }}
        />
      </TableBody>
    </Table>
  );

describe('MembershipRow', () => {
  afterEach(cleanup);

  describe('being rendered', () => {
    it('should not break', () => {
      expect(build).not.toThrow();
    });
  });

  describe('membership with team details is given', () => {
    const membership = {
      admin: false,
      roles: [{ name: 'Role 2', sys: { id: 'role2' } }, { name: 'Role 3', sys: { id: 'role3' } }],
      sys: {
        id: 'membership1',
        team: {
          name: 'Team 1',
          memberCount: 1,
          description: 'This is Team 1',
          sys: { id: 'team1' }
        }
      }
    };

    it('should render membership and team details', async () => {
      const { findByTestId } = build({ membership });

      expect(await findByTestId('team.name')).toHaveTextContent('Team 1');
      expect(await findByTestId('team.description')).toHaveTextContent('This is Team 1');
      expect(await findByTestId('member-count-cell')).toHaveTextContent('1 member');
      expect(await findByTestId('roles-cell')).toHaveTextContent('Role 2 and Role 3');
    });

    it('should open / close menu', async () => {
      expect(
        await build({ menuIsOpen: false }).queryByTestId('change-role')
      ).not.toBeInTheDocument();
      expect(await build({ menuIsOpen: true }).queryByTestId('change-role')).toBeInTheDocument();
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
        { name: 'Role 4', sys: { id: 'role4' } }
      ];

      it('should show role editor with all available roles in edit mode', async () => {
        const { findAllByTestId, findByTestId } = build({
          membership,
          isEditing: true,
          availableRoles
        });

        fireEvent.click(await findByTestId('space-role-editor.button'));
        expect(await findByTestId('space-role-editor.admin-option')).toBeInTheDocument();
        expect(await findAllByTestId('space-role-editor.role-option')).toHaveLength(4);
      });
    });
  });
});
