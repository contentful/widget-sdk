import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  Button,
  ModalLauncher,
  Paragraph,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { RolesWorkbenchSkeleton } from '../skeletons/RolesWorkbenchSkeleton';
import { AdministratorRoleListItem, RoleListItem } from './RoleListItem';
import * as ResourceUtils from 'utils/ResourceUtils';
import { ReachedRolesLimitNote } from './ReachedRolesLimitNote';
import { CustomRolesPlanNote } from './CustomRolesPlanNote';
import { createRoleRemover } from '../components/RoleRemover';
import {
  CUSTOM_ROLES_CONTENT_ENTRY_ID,
  FeatureModal,
  handleHighValueLabelTracking,
  ROLES_AND_PERMISSIONS_TRACKING_NAME,
} from 'features/high-value-modal';
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';
import { useRouteNavigate } from 'core/react-routing';

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

const openDialog = (modalData) => {
  handleHighValueLabelTracking('click', ROLES_AND_PERMISSIONS_TRACKING_NAME, false);

  ModalLauncher.open(({ onClose, isShown }) => (
    <FeatureModal
      isShown={isShown}
      onClose={() => onClose()}
      {...modalData}
      featureTracking={ROLES_AND_PERMISSIONS_TRACKING_NAME}
    />
  ));
};

// get high value label modal data from Contentful
const initialFetch = async () => await fetchWebappContentByEntryID(CUSTOM_ROLES_CONTENT_ENTRY_ID);

function RoleListActions(props) {
  const navigate = useRouteNavigate();
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
  const showHighValueLabel = props.highValueLabelEnabled && !props.hasCustomRolesFeature;

  return (
    <div className={styles.actions}>
      {showHighValueLabel && (
        <Tooltip
          place="left"
          content="This feature is a part of Enterprise plan."
          onMouseOver={() =>
            handleHighValueLabelTracking('hover', ROLES_AND_PERMISSIONS_TRACKING_NAME, false)
          }>
          <Button
            icon="InfoCircle"
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
            Your space is using {usage} out of{' '}
            {props.newApiRolesLimit ? props.newApiRolesLimit : props.limit} available roles.
          </Paragraph>
          {props.isOrgOnTrial && props.highValueLabelEnabled ? (
            <Tooltip
              place="bottom"
              content="This feature is a part of the Enterprise plan. You can use it during your trial."
              onMouseOver={() =>
                handleHighValueLabelTracking('hover', ROLES_AND_PERMISSIONS_TRACKING_NAME, true)
              }>
              <Button
                icon="InfoCircle"
                className={styles.addRoleButton}
                testId="add-role-button"
                buttonType="primary"
                disabled={props.hasReachedLimit}
                onClick={() => {
                  handleHighValueLabelTracking('click', ROLES_AND_PERMISSIONS_TRACKING_NAME, true);
                  navigate({ path: 'roles.new' });
                }}>
                Create a new role
              </Button>
            </Tooltip>
          ) : (
            <Button
              className={styles.addRoleButton}
              testId="add-role-button"
              buttonType="primary"
              disabled={props.hasReachedLimit}
              onClick={() => {
                navigate({ path: 'roles.new' });
              }}>
              Create a new role
            </Button>
          )}
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
  newApiRolesLimit: PropTypes.number,
  highValueLabelEnabled: PropTypes.bool,
  isOrgOnTrial: PropTypes.bool,
};

export function RolesList(props) {
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
          hasCustomRolesFeature={props.hasCustomRolesFeature}
          rolesResource={props.rolesResource}
          newApiRolesLimit={props.newApiRolesLimit}
          highValueLabelEnabled={props.highValueLabelEnabled}
          isOrgOnTrial={props.isOrgOnTrial}
        />
      }>
      <div className={styles.container}>
        {props.hasCustomRolesFeature && hasReachedLimit && (
          <ReachedRolesLimitNote
            canUpgradeOrganization={props.canUpgradeOrganization}
            limit={limit}
          />
        )}
        {!props.hasCustomRolesFeature && <CustomRolesPlanNote />}
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
  canUpgradeOrganization: PropTypes.bool.isRequired,
  roleCounts: PropTypes.shape({
    admin: PropTypes.number.isRequired,
  }).isRequired,
  rolesResource: PropTypes.object.isRequired,
  listHandler: PropTypes.object.isRequired,
  refetch: PropTypes.func.isRequired,
  newApiRolesLimit: PropTypes.number,
  highValueLabelEnabled: PropTypes.bool,
  isOrgOnTrial: PropTypes.bool,
};
