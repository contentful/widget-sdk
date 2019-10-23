import { getModule } from 'NgRegistry.es6';
import React from 'react';
import PropTypes from 'prop-types';
import { Notification, ModalConfirm, Paragraph } from '@contentful/forma-36-react-components';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import ReloadNotification from 'app/common/ReloadNotification.es6';
import { getInstance } from 'access_control/RoleRepository';

export function createRoleRemover(listHandler, role) {
  const spaceContext = getModule('spaceContext');
  const roleRepo = getInstance(spaceContext.space);

  const uniqueModalKey = 'remove-role-' + Date.now();
  return ModalLauncher.open(({ isShown, onClose }) => {
    const roleCount = listHandler.getRoleCounts()[role.sys.id];
    const isUsed = roleCount > 0;
    return (
      <RemoveRoleModalConfirm
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

export function RemoveRoleModalConfirm(props) {
  const [loading, setLoading] = React.useState(false);

  return (
    <ModalConfirm
      intent="negative"
      isShown={props.isShown}
      cancelLabel={props.isUsed ? 'OK' : 'Cancel'}
      isConfirmLoading={loading}
      onConfirm={() => {
        setLoading(true);
        props.onConfirm().finally(() => {
          setLoading(false);
        });
      }}
      onCancel={props.onCancel}
      confirmLabel={props.isUsed ? false : 'Delete the role'}
      title="Delete role"
      shouldCloseOnOverlayClick={false}>
      {props.isUsed ? (
        <>
          <Paragraph>
            Before deleting the <strong>{props.role.name}</strong> role, you need to move all the{' '}
            {props.count} users to another role.
          </Paragraph>
          <Paragraph>Some of these users might recieve this role via a team membership.</Paragraph>
        </>
      ) : (
        <Paragraph>
          Are you sure that you want to delete <strong>{props.role.name}</strong>?
        </Paragraph>
      )}
    </ModalConfirm>
  );
}

RemoveRoleModalConfirm.propTypes = {
  isShown: PropTypes.bool.isRequired,
  role: PropTypes.shape({
    name: PropTypes.string
  }),
  isUsed: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  count: PropTypes.number,
  roleOptions: PropTypes.array.isRequired
};
