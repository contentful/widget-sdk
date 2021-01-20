import React, { useMemo } from 'react';
import { css } from 'emotion';
import { Spinner } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';

import { getRandomMessage } from '../utils/messages';

const styles = {
  message: css({
    fontSize: tokens.fontSizeL,
    fontWeight: tokens.fontWeightDemiBold,
  }),
};

interface LoadingStateProps {
  testId?: string;
}

export function LoadingState({ testId = 'cf-loading-state' }: LoadingStateProps) {
  const randomMsg = useMemo(getRandomMessage, []);

  return (
    <Flex
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      fullHeight
      fullWidth
      testId={testId}>
      <Spinner size="large" color="primary" />
      <Flex marginTop="spacingM">
        <span className={styles.message}>{randomMsg}</span>
      </Flex>
    </Flex>
  );
}
