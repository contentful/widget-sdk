import React, { useReducer, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  RadioButtonField,
  CheckboxField,
  Button,
  Notification,
  FieldGroup,
  SkeletonContainer,
  SkeletonBodyText,
} from '@contentful/forma-36-react-components';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { fetchAll } from 'data/CMA/FetchAll';
import { createImmerReducer } from 'core/utils/createImmerReducer';
import { ADMIN_ROLE_ID } from 'access_control/constants';
import { useAsync } from 'core/hooks';
import { SpaceMembership } from 'app/OrganizationSettings/PropTypes';
import { create } from 'access_control/SpaceMembershipRepository';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  roles: css({
    marginTop: tokens.spacingS,
    marginLeft: tokens.spacingL,
  }),
};

const reducer = createImmerReducer({
  ADMIN_SELECTED: (state) => {
    state.selectedRoleIds = [ADMIN_ROLE_ID];
    state.adminSelected = true;
  },
  OTHER_ROLES_SELECTED: (state) => {
    state.selectedRoleIds = [];
    state.adminSelected = false;
  },
  ROLE_CHANGED: (state, action) => {
    const { checked, role } = action.payload;

    if (checked) {
      state.selectedRoleIds.push(role.sys.id);
    } else {
      state.selectedRoleIds = state.selectedRoleIds.filter((id) => id !== role.sys.id);
    }
  },
  SUBMITTED: (state) => {
    state.isSubmitted = true;
  },
});

export default function EditSpaceMembershipModal({ membership, isShown, onClose, onChange }) {
  const [{ selectedRoleIds, adminSelected, isSubmitted }, dispatch] = useReducer(reducer, {
    adminSelected: membership.admin,
    selectedRoleIds: membership.roles.map((role) => role.sys.id),
    isSubmitted: false,
  });
  const spaceId = membership.sys.space.sys.id;
  const { data: spaceRoles, isLoading: isLoadingRoles } = useAsync(
    useCallback(() => fetchSpaceRoles(spaceId), [spaceId])
  );

  const submit = async () => {
    try {
      dispatch({ type: 'SUBMITTED' });
      const updatedMembership = await changeSpaceMembershipRole(membership, selectedRoleIds);
      // response comes with unresolved links
      // we use the data from the old membership to replace the links with
      const space = membership.sys.space;
      const createdBy = membership.sys.createdBy;
      const roles = spaceRoles.filter((role) => selectedRoleIds.includes(role.sys.id));

      updatedMembership.sys.space = space;
      updatedMembership.sys.createdBy = createdBy;
      updatedMembership.roles = roles;

      onChange(updatedMembership);
    } catch (e) {
      Notification.error(e.data.message);
    } finally {
      onClose(true);
    }
  };

  return (
    <Modal
      title={`Choose space roles`}
      isShown={isShown}
      onClose={onClose}
      size="small"
      testId="edit-space-membership">
      {({ title, onClose }) => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <FieldGroup>
              <RadioButtonField
                id="admin"
                labelText="Admin"
                helpText="Can manage everything in the space"
                checked={adminSelected}
                onChange={(e) => e.target.checked && dispatch({ type: 'ADMIN_SELECTED' })}
              />

              {isLoadingRoles && (
                <SkeletonContainer height={116}>
                  <SkeletonBodyText numberOfLines={1} width={120} />
                  <SkeletonBodyText numberOfLines={1} offsetLeft={40} offsetTop={29} width={90} />
                  <SkeletonBodyText numberOfLines={1} offsetLeft={40} offsetTop={58} width={75} />
                  <SkeletonBodyText numberOfLines={1} offsetLeft={40} offsetTop={87} width={100} />
                </SkeletonContainer>
              )}

              {!isLoadingRoles && spaceRoles && (
                <>
                  <RadioButtonField
                    id="other"
                    labelText="Other roles"
                    checked={!adminSelected}
                    onChange={(e) => e.target.checked && dispatch({ type: 'OTHER_ROLES_SELECTED' })}
                  />

                  <div className={styles.roles}>
                    <FieldGroup>
                      {spaceRoles.map((role) => (
                        <CheckboxField
                          key={role.sys.id}
                          id={role.sys.id}
                          labelText={role.name}
                          labelIsLight={true}
                          checked={selectedRoleIds.includes(role.sys.id)}
                          disabled={adminSelected}
                          onChange={(e) =>
                            dispatch({
                              type: 'ROLE_CHANGED',
                              payload: { checked: e.target.checked, role },
                            })
                          }
                        />
                      ))}
                    </FieldGroup>
                  </div>
                </>
              )}
            </FieldGroup>
          </Modal.Content>
          <Modal.Controls>
            <Button
              buttonType="positive"
              onClick={submit}
              loading={isSubmitted}
              disabled={isLoadingRoles}>
              Confirm
            </Button>
            <Button buttonType="muted" disabled={isSubmitted} onClick={() => onClose(true)}>
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
}

EditSpaceMembershipModal.propTypes = {
  membership: SpaceMembership.isRequired,
  onChange: PropTypes.func.isRequired,
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

function fetchSpaceRoles(spaceId) {
  const endpoint = createSpaceEndpoint(spaceId);
  return fetchAll(endpoint, ['roles'], 100);
}

function changeSpaceMembershipRole(membership, roleIds) {
  const spaceId = membership.sys.space.sys.id;
  const endpoint = createSpaceEndpoint(spaceId);
  const repo = create(endpoint);

  return repo.changeRoleTo(membership, roleIds);
}
