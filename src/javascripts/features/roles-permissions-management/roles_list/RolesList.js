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
  Tooltip,
  ModalLauncher,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { RolesWorkbenchSkeleton } from '../skeletons/RolesWorkbenchSkeleton';
import { RoleListItem, AdministratorRoleListItem } from './RoleListItem';
import { go } from 'states/Navigator';
import * as ResourceUtils from 'utils/ResourceUtils';
import { ReachedRolesLimitNote } from './ReachedRolesLimitNote';
import { CustomRolesPlanNote } from './CustomRolesPlanNote';
import { createRoleRemover } from '../components/RoleRemover';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { CUSTOM_ROLES_CONTENT_ENTRY_ID, FeatureModal } from 'features/high-value-modal';
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';

const styles = {
  actions: css({
    display: 'flex',
    alignItems: 'center',
  }),
  addRoleButton: css({
    marginLeft: tokens.spacingL,
  }),
  container: css({
    marginTop: tokens.spacingL,
  }),
};

const openDialog = (modalData) =>
  ModalLauncher.open(({ onClose, isShown }) => (
    <FeatureModal isShown={isShown} onClose={() => onClose(true)} {...modalData} />
  ));

// get high value label modal data from Contentful
const initialFetch = async () => await fetchWebappContentByEntryID(CUSTOM_ROLES_CONTENT_ENTRY_ID);

function RoleListActions(props) {
  const usage = ResourceUtils.getAccumulatedUsage(props.rolesResource);
  const fetchData = async () => {
    try {
      const modalData = await initialFetch();
      openDialog(modalData);
    } catch {
      // do nothing, user will be able to see tooltip with information about the feature
      throw new Error('Something went wrong while fetching data from Contentful');
    }
  };

  return (
    <div className={styles.actions}>
      {props.highValueLabelEnabled && !props.hasCustomRolesFeature && (
        <Tooltip place="left" content="This feature is a part of Enterprise plan. ">
          <Button
            icon="InfoCircle"
            className={styles.addRoleButton}
            testId="add-role-button"
            buttonType="primary"
            onClick={fetchData}>
            Create a new role
          </Button>
        </Tooltip>
      )}
      {props.hasCustomRolesFeature && (
        <>
          <Paragraph>
            Your {props.isLegacyOrganization ? 'organization' : 'space'} is using {usage} out of{' '}
            {props.newApiRolesLimit ? props.newApiRolesLimit : props.limit} available roles.
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
  newApiRolesLimit: PropTypes.number,
  highValueLabelEnabled: PropTypes.bool,
};

export function RolesList(props) {
  const hasReachedLimit = !ResourceUtils.canCreate(props.rolesResource);
  const limit = ResourceUtils.getResourceLimits(props.rolesResource).maximum;
  const { currentSpace } = useSpaceEnvContext();

  const removeRole = (role) =>
    createRoleRemover(props.listHandler, role, currentSpace).then((removed) => {
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
          newApiRolesLimit={props.newApiRolesLimit}
          highValueLabelEnabled={props.highValueLabelEnabled}
        />
      }>
      <div className={styles.container}>
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
              <TableCell />
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
      </div>
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
  newApiRolesLimit: PropTypes.number,
  highValueLabelEnabled: PropTypes.bool,
};
