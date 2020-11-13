import React from 'react';
import pluralize from 'pluralize';
import PropTypes from 'prop-types';
import { Notification, ModalConfirm, Paragraph } from '@contentful/forma-36-react-components';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import ReloadNotification from 'app/common/ReloadNotification';
import { getInstance } from 'access_control/RoleRepository';
import { jumpToRole } from '../utils/jumpToRole';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';

export function createRoleRemover(listHandler, role, space) {
  const roleRepo = getInstance(space);

  const uniqueModalKey = 'remove-role-' + Date.now();
  return ModalLauncher.open(({ isShown, onClose }) => {
    const roleCount = listHandler.getRoleCounts()[role.sys.id];
    const isUsed = roleCount > 0;
    return (
      <RemoveRoleModalConfirm
        isMasterEnvironment={isCurrentEnvironmentMaster(space)}
        key={uniqueModalKey}
        isShown={isShown}
        role={role}
        onConfirm={async () => {
          try {
            await remove();
            onClose(true);
          } catch (error) {
            ReloadNotification.basicErrorHandler(error);
          }
        }}
        onCancel={() => {
          onClose(false);
        }}
        count={roleCount}
        isUsed={isUsed}
        roleOptions={listHandler.getRoleOptions().filter(({ id }) => id !== role.sys.id)}
      />
    );
  });

  function remove() {
    return roleRepo.remove(role).then(() => {
      Notification.success('Role successfully deleted.');
    });
  }
}

export function RemoveRoleModalConfirm({
  isUsed,
  isShown,
  onCancel,
  onConfirm,
  role,
  count,
  isMasterEnvironment,
}) {
  const [loading, setLoading] = React.useState(false);

  return (
    <ModalConfirm
      intent={isUsed ? 'primary' : 'negative'}
      isShown={isShown}
      cancelLabel={isUsed ? 'OK, got it' : 'Cancel'}
      isConfirmLoading={loading}
      onConfirm={() => {
        if (isUsed) {
          jumpToRole(role.name, isMasterEnvironment);
          onCancel();
          return;
        }
        setLoading(true);
        onConfirm().finally(() => {
          setLoading(false);
        });
      }}
      onCancel={onCancel}
      confirmLabel={isUsed ? 'View users with this role' : 'Delete the role'}
      title={isUsed ? 'Move users before deleting' : 'Delete role'}
      shouldCloseOnOverlayClick={false}>
      {isUsed ? (
        <>
          <Paragraph>
            Assign a different role to <strong>{pluralize('user', count, true)}</strong> with the{' '}
            {role.name} role before deleting.
          </Paragraph>
          <Paragraph>They might have the role because they’re a member of a team.</Paragraph>
        </>
      ) : (
        <Paragraph>
          Are you sure that you want to delete <strong>{role.name}</strong>?
        </Paragraph>
      )}
    </ModalConfirm>
  );
}

RemoveRoleModalConfirm.propTypes = {
  isShown: PropTypes.bool.isRequired,
  role: PropTypes.shape({
    name: PropTypes.string,
  }),
  isUsed: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isMasterEnvironment: PropTypes.bool.isRequired,
  count: PropTypes.number,
};
