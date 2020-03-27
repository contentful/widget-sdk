import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Button,
  Note,
  Table,
  TableRow,
  TableBody,
  TableCell,
} from '@contentful/forma-36-react-components';
import { OrganizationMembership as OrganizationMembershipPropType } from 'app/OrganizationSettings/PropTypes';
import { getFullNameOrEmail } from 'app/OrganizationSettings/Users/UserUtils';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  note: css({
    marginBottom: tokens.spacingS,
  }),
};

export default function AddUsersError({ rejected, onRetry, onClose }) {
  return (
    <>
      <Modal.Content>
        <Note noteType="negative" className={styles.note}>
          {`Whoops, something went wrong on our side and some users could not be added to the space.`}
        </Note>

        <Table>
          <TableBody>
            {rejected.map((orgMembership) => (
              <TableRow key={orgMembership.sys.id}>
                <TableCell>{getFullNameOrEmail(orgMembership.sys.user)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Modal.Content>
      <Modal.Controls>
        <>
          <Button
            onClick={onRetry}
            buttonType="positive"
            testId="add-users.error-state.retry-button">
            Try again
          </Button>
          <Button
            buttonType="muted"
            onClick={() => onClose(true)}
            testId="add-users.error-state.cancel-button">
            Cancel
          </Button>
        </>
      </Modal.Controls>
    </>
  );
}
AddUsersError.propTypes = {
  rejected: PropTypes.arrayOf(OrganizationMembershipPropType.isRequired),
  onRetry: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
