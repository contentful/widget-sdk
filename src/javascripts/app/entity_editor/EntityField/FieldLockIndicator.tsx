import * as React from 'react';
import { Tooltip, Icon } from '@contentful/forma-36-react-components';
import { css } from 'emotion';

const styles = {
  lockComponentContainer: css({
    whiteSpace: 'nowrap',
  }),
  lockIcon: css({
    marginBottom: '-3px',
  }),
};

export function FieldLockIndicator(props: { tooltipContent?: string; text: string }) {
  const { text, tooltipContent } = props;

  const node = (
    <div className={styles.lockComponentContainer}>
      <Icon icon="Lock" color="muted" className={styles.lockIcon} />
      {text && <span>{text}</span>}
    </div>
  );

  if (tooltipContent) {
    return (
      <Tooltip content={tooltipContent} place="left">
        {node}
      </Tooltip>
    );
  }

  return node;
}
