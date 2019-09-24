import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { isEmpty, xor, without } from 'lodash';
import { ModalConfirm, Note } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

import RoleSelector from 'app/SpaceSettings/Teams/AddTeams/RoleSelector.es6';

const styles = {
  roleSelectionContainer: css({
    maxWidth: '20rem'
  }),
  warning: css({
    marginBottom: tokens.spacingS
  })
};

const RoleChangeDialog = ({
  availableRoles,
  initiallySelectedRoleIds,
  displayName,
  isShown,
  onClose,
  memberId,
  isLastAdmin
}) => {
  const [selectedRoleIds, setSelectedRoleIds] = useState(initiallySelectedRoleIds);
  const isCurrentlyAdmin = isEmpty(initiallySelectedRoleIds);
  const [isAdminSelected, setAdminSelected] = useState(isCurrentlyAdmin);
  const reset = useCallback(() => {
    setSelectedRoleIds(initiallySelectedRoleIds);
    setAdminSelected(isEmpty(initiallySelectedRoleIds));
  }, [initiallySelectedRoleIds]);
  useEffect(reset, [memberId]);
  return (
    <ModalConfirm
      title={`Change role for ${displayName}`}
      intent="positive"
      confirmLabel="Assign new role"
      isShown={isShown}
      onConfirm={() => onClose(selectedRoleIds)}
      onCancel={() => {
        reset();
        onClose(false);
      }}
      allowHeightOverflow={true}
      isConfirmDisabled={
        isEmpty(xor(initiallySelectedRoleIds, selectedRoleIds)) ||
        (!isAdminSelected && isEmpty(selectedRoleIds))
      }>
      {isLastAdmin && (
        <Note noteType="warning" className={styles.warning}>
          {displayName} is the last Administrator in this space. Please be aware that if you remove
          this user, there will be no one who can fully control the space. This, however, can be
          managed from your Organization settings.
        </Note>
      )}
      <div className={styles.roleSelectionContainer}>
        <RoleSelector
          roles={availableRoles}
          selectedRoleIds={selectedRoleIds}
          adminSelected={isAdminSelected}
          onRoleSelected={(id, isSelected) =>
            setSelectedRoleIds(isSelected ? [...selectedRoleIds, id] : without(selectedRoleIds, id))
          }
          onAdminSelected={isSelected =>
            setAdminSelected(isSelected) || (isSelected && setSelectedRoleIds([]))
          }
        />
      </div>
    </ModalConfirm>
  );
};
RoleChangeDialog.propTypes = {
  availableRoles: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  initiallySelectedRoleIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  displayName: PropTypes.string.isRequired,
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  memberId: PropTypes.string.isRequired,
  isLastAdmin: PropTypes.bool.isRequired
};

export default RoleChangeDialog;
