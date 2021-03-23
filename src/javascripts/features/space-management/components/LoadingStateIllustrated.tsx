import React from 'react';

import { Flex } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { StorkIllustration } from './StorkIllustration';
import { StepStatus } from '../types';
import { CompletedCopy } from './CompletedCopy';
import { RunningCopy } from './RunningCopy';

const styles = {
  image: css({
    maxHeight: '60vh',
    maxWidth: '60vw',
  }),
  emptyContainer: css({
    zIndex: tokens.zIndexNotification,
    textAlign: 'center',
    height: '100%',
  }),
};

type LoadingStateIllustratedType = {
  status: StepStatus;
};

export function LoadingStateIllustrated({ status }: LoadingStateIllustratedType) {
  return (
    <Flex
      fullHeight
      fullWidth
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      className={styles.emptyContainer}>
      {/* We might want to have an option to pass this illustration as a prop in the future */}
      <StorkIllustration className={styles.image} />
      <Flex flexDirection="column" marginTop="spacing2Xl" justifyContent="center">
        {status === StepStatus.RUNNING && <RunningCopy />}
        {status === StepStatus.COMPLETED && <CompletedCopy />}
      </Flex>
    </Flex>
  );
}
