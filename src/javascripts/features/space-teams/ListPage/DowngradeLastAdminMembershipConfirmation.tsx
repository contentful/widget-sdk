import React, { useEffect, useState } from 'react';
import { TextInput, ModalConfirm, Paragraph } from '@contentful/forma-36-react-components';

type DowngradeLastAdminMembershipConfirmationProps = {
  close: () => void;
  onConfirm: () => void;
  isShown: boolean;
  teamName: string;
  isLastAdminMembership: boolean;
};

const DowngradeLastAdminMembershipConfirmation = ({
  close,
  isShown,
  onConfirm,
  teamName,
  isLastAdminMembership,
}: DowngradeLastAdminMembershipConfirmationProps) => {
  const [userConfirmationInput, setUserConfirmationInput] = useState('');

  useEffect(() => {
    !isShown && setUserConfirmationInput('');
  }, [isShown]);

  return (
    <ModalConfirm
      onCancel={close}
      // TODO: add type declaration in forma for onClose property
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      onClose={close}
      onConfirm={onConfirm}
      isShown={isShown}
      title="Change role of team for this space"
      intent="negative"
      confirmLabel="Change role"
      cancelLabel="Don't change role"
      isConfirmDisabled={userConfirmationInput !== 'I UNDERSTAND'}>
      <div>
        <Paragraph>
          You are removing the admin role of the team {<strong>{teamName}</strong>}.
          {isLastAdminMembership &&
            ' This team has a user with the last administrator role for this space.'}
        </Paragraph>
        {!isLastAdminMembership && (
          <Paragraph>
            If you change this role, you will lose your administrator role for this space.
          </Paragraph>
        )}
        {isLastAdminMembership && (
          <Paragraph>
            If you change this role, it can only be managed by an organization admin.
          </Paragraph>
        )}
        <Paragraph>
          To confirm you want to change this role, please type
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

export { DowngradeLastAdminMembershipConfirmation };
