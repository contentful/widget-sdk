import React, { useCallback } from 'react';
import { Notification, TextLink } from '@contentful/forma-36-react-components';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import * as Analytics from 'analytics/Analytics';

import { FeedbackDialog } from './FeedbackDialog';

export interface FeedbackButtonProps {
  about: string;
  target: string;
  label?: string;
}

export function FeedbackButton(props: FeedbackButtonProps) {
  const { about, target, label = 'Give feedback' } = props;
  const onClick = useCallback(async () => {
    const feedback = await ModalLauncher.open(({ isShown, onClose }) => (
      <FeedbackDialog
        key={`${Date.now()}`}
        about={about}
        isShown={isShown}
        onCancel={() => onClose(false)}
        onConfirm={onClose}
      />
    ));

    if (feedback) {
      Analytics.track('feedback:give', { about, target, feedback });
      Notification.success('Thank you for your feedback!');
    }
  }, [about, target]);

  return <TextLink onClick={onClick}>{label}</TextLink>;
}
