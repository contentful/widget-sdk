import React from 'react';

import { Flex, ModalConfirm, ModalLauncher } from '@contentful/forma-36-react-components';

type Action = 'replace' | 'remove';

type AllLocalesActionConfirmProps = {
  action: Action;
  isShown: boolean;
  onClose: (confirmed: boolean) => void;
};

export function confirmAllLocalesAction(action: Action) {
  return ModalLauncher.open<boolean>((props) => (
    <AllLocalesActionConfirm {...props} action={action} />
  ));
}

type AllLocalesConfirmModalProps = Omit<AllLocalesActionConfirmProps, 'action'> & {
  title: string;
  description: string;
  confirmLabel: string;
};

const AllLocalesConfirmModal = ({
  isShown,
  onClose,
  title,
  description,
  confirmLabel,
}: AllLocalesConfirmModalProps) => (
  <ModalConfirm
    isShown={isShown}
    intent="negative"
    title={title}
    confirmLabel={confirmLabel}
    size="medium"
    onCancel={() => onClose(false)}
    onConfirm={() => onClose(true)}>
    <Flex>{description}</Flex>
  </ModalConfirm>
);

const RemoveAllLocalesConfirm = (props: Omit<AllLocalesActionConfirmProps, 'action'>) => (
  <AllLocalesConfirmModal
    {...props}
    title="You are removing all the locales initial value"
    description="Clearing all the locales initial value will remove all the values you have already set."
    confirmLabel="Clear"
  />
);

const ReplaceAllLocalesConfirm = (props: Omit<AllLocalesActionConfirmProps, 'action'>) => (
  <AllLocalesConfirmModal
    {...props}
    title="You are replacing initial values"
    description="Applying the same initial value to all locales will replace the values you have already set."
    confirmLabel="Replace"
  />
);

export function AllLocalesActionConfirm({
  isShown,
  onClose,
  action,
}: AllLocalesActionConfirmProps) {
  switch (action) {
    case 'remove':
      return <RemoveAllLocalesConfirm isShown={isShown} onClose={onClose} />;
    case 'replace':
      return <ReplaceAllLocalesConfirm isShown={isShown} onClose={onClose} />;
    default:
      throw new Error(`Can not handle ${action} action`);
  }
}
