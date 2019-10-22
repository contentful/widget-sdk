import { getModule } from 'NgRegistry.es6';
import React from 'react';
import PropTypes from 'prop-types';
import { map } from 'lodash';
import {
  Notification,
  ModalConfirm,
  Paragraph,
  Typography,
  SelectField,
  Option
} from '@contentful/forma-36-react-components';
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
        onConfirm={async moveToRoleId => {
          try {
            if (moveToRoleId) {
              await moveUsersAndRemoveRole(moveToRoleId);
            }
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

  function moveUsersAndRemoveRole(moveToRoleId) {
    const memberships = listHandler.getMemberships();
    const promises = map(memberships, membership =>
      spaceContext.memberships.changeRoleTo(membership, [moveToRoleId])
    );
    return Promise.all(promises);
  }
}

export function RemoveRoleModalConfirm(props) {
  const [loading, setLoading] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState('');

  return (
    <ModalConfirm
      intent="negative"
      isShown={props.isShown}
      cancelLabel="Cancel"
      isConfirmLoading={loading}
      isConfirmDisabled={props.isUsed ? selectedRole === '' : false}
      onConfirm={() => {
        setLoading(true);
        props.onConfirm(selectedRole).finally(() => {
          setLoading(false);
        });
      }}
      onCancel={props.onCancel}
      confirmLabel={props.isUsed ? 'Move users and delete the role' : 'Delete the role'}
      title={`Delete role`}
      shouldCloseOnOverlayClick={false}>
      {props.isUsed ? (
        <Typography>
          <Paragraph>
            Before deleting the <strong>{props.role.name}</strong> role you need to move all the{' '}
            {props.count} users to another role.
          </Paragraph>
          <SelectField
            labelText="New role"
            id="field-role"
            name="field-role"
            onChange={e => {
              setSelectedRole(e.target.value);
            }}>
            <Option value="">Select the role to which you want to move users</Option>
            {props.roleOptions.map(roleOption => (
              <Option key={roleOption.id} value={roleOption.id}>
                {roleOption.name}
              </Option>
            ))}
          </SelectField>
        </Typography>
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
