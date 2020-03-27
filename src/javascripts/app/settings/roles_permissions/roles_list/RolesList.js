import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
  Paragraph,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { RolesWorkbenchSkeleton } from '../skeletons/RolesWorkbenchSkeleton';
import { RoleListItem, AdministratorRoleListItem } from './RoleListItem';
import { go } from 'states/Navigator';
import * as ResourceUtils from 'utils/ResourceUtils';
import ReachedRolesLimitNote from './ReachedRolesLimitNote';
import CustomRolesPlanNote from './CustomRolesPlanNote';
import { createRoleRemover } from 'access_control/RoleRemover';

const styles = {
  actions: css({
    display: 'flex',
    alignItems: 'center',
  }),
  addRoleButton: css({
    marginLeft: tokens.spacingL,
  }),
};

function RoleListActions(props) {
  const usage = props.rolesResource.usage;
  return (
    <div className={styles.actions}>
      {props.hasCustomRolesFeature && (
        <>
          <Paragraph>
            Your {props.isLegacyOrganization ? 'organization' : 'space'} is using {usage} out of{' '}
            {props.limit} available roles.
          </Paragraph>
          <Button
            className={styles.addRoleButton}
            testId="add-role-button"
            buttonType="primary"
            disabled={props.hasReachedLimit}
            onClick={() => {
              go({ path: '^.new' });
            }}>
            Create a new role
          </Button>
        </>
      )}
    </div>
  );
}
RoleListActions.propTypes = {
  limit: PropTypes.number.isRequired,
  hasReachedLimit: PropTypes.bool.isRequired,
  hasCustomRolesFeature: PropTypes.bool.isRequired,
  rolesResource: PropTypes.object.isRequired,
  isLegacyOrganization: PropTypes.bool.isRequired,
};

export default function RolesList(props) {
  const hasReachedLimit = !ResourceUtils.canCreate(props.rolesResource);
  const limit = ResourceUtils.getResourceLimits(props.rolesResource).maximum;

  const removeRole = (role) =>
    createRoleRemover(props.listHandler, role).then((removed) => {
      if (removed) {
        props.refetch();
      }
    });

  return (
    <RolesWorkbenchSkeleton
      title={`Roles (${props.roles.length + 1})`}
      actions={
        <RoleListActions
          limit={limit}
          hasReachedLimit={hasReachedLimit}
          isLegacyOrganization={props.isLegacyOrganization}
          hasCustomRolesFeature={props.hasCustomRolesFeature}
          rolesResource={props.rolesResource}
        />
      }>
      {props.hasCustomRolesFeature && hasReachedLimit && (
        <ReachedRolesLimitNote
          isLegacyOrganization={props.isLegacyOrganization}
          canUpgradeOrganization={props.canUpgradeOrganization}
          limit={limit}
        />
      )}
      {!props.hasCustomRolesFeature && (
        <CustomRolesPlanNote isLegacyOrganization={props.isLegacyOrganization} />
      )}
      <Table testId="roles-list-table">
        <TableHead>
          <TableRow>
            <TableCell>Role</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Members</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <AdministratorRoleListItem
            hasCustomRolesFeature={props.hasCustomRolesFeature}
            count={props.roleCounts.admin}
          />
          {props.roles.map((role) => (
            <RoleListItem
              key={role.sys.id}
              role={role}
              hasCustomRolesFeature={props.hasCustomRolesFeature}
              onRemoveRole={removeRole}
            />
          ))}
        </TableBody>
      </Table>
    </RolesWorkbenchSkeleton>
  );
}

RolesList.propTypes = {
  roles: PropTypes.array.isRequired,
  hasCustomRolesFeature: PropTypes.bool.isRequired,
  isLegacyOrganization: PropTypes.bool.isRequired,
  canUpgradeOrganization: PropTypes.bool.isRequired,
  roleCounts: PropTypes.shape({
    admin: PropTypes.number.isRequired,
  }).isRequired,
  rolesResource: PropTypes.object.isRequired,
  listHandler: PropTypes.object.isRequired,
  refetch: PropTypes.func.isRequired,
};
