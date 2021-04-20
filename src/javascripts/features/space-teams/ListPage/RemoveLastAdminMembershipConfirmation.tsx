import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { TextInput, ModalConfirm, Paragraph } from '@contentful/forma-36-react-components';

type RemoveLastAdminMembershipConfirmationProps = {
  close: () => void;
  onConfirm: () => void;
  isShown: boolean;
  teamName: string;
  isLastAdminMembership: boolean;
};

const RemoveLastAdminMembershipConfirmation = ({
  close,
  isShown,
  onConfirm,
  teamName,
  isLastAdminMembership,
}: RemoveLastAdminMembershipConfirmationProps) => {
  const [userConfirmationInput, setUserConfirmationInput] = useState('');

  useEffect(() => {
    !isShown && setUserConfirmationInput('');
  }, [isShown]);

  return (
    <ModalConfirm
      testId="remove-own-admin-confirmation"
      onCancel={close}
      // TODO: add type declaration in forma for onClose property
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      onClose={close}
      onConfirm={onConfirm}
      isShown={isShown}
      title="Remove team from this space"
      intent="negative"
      confirmLabel="Remove"
      cancelLabel="Don't remove"
      isConfirmDisabled={userConfirmationInput !== 'I UNDERSTAND'}>
      <div>
        <Paragraph>
          You are removing the team {<strong>{teamName}</strong>} from this space.
          {isLastAdminMembership &&
            ' This team has a user with the last administrator role for this space.'}
        </Paragraph>
        {!isLastAdminMembership && (
          <Paragraph>
            If you remove this team, you will lose your administrator role for this space.
          </Paragraph>
        )}
        {isLastAdminMembership && (
          <Paragraph>
            If you remove this team, it can only be managed by an organization admin.
          </Paragraph>
        )}
        <Paragraph>
          To confirm you want to remove this team, please type
          {<strong> &quot;I&nbsp;UNDERSTAND&quot; </strong>}
          in the field below:
        </Paragraph>
        <TextInput
          value={userConfirmationInput}
          onChange={({ target: { value } }) => setUserConfirmationInput(value)}
        />
      </div>
    </ModalConfirm>
  );
};

RemoveLastAdminMembershipConfirmation.propTypes = {
  close: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isShown: PropTypes.bool.isRequired,
  teamName: PropTypes.string.isRequired,
  isLastAdminMembership: PropTypes.bool.isRequired,
};

export { RemoveLastAdminMembershipConfirmation };
