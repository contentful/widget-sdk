import React, { useMemo, useEffect, useState } from 'react';
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
  const [message, setMessage] = useState(randomMsg);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessage('Sorry, this is taking longer than expected!');
    }, 4000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <span className={styles.message}>{message}</span>
      </Flex>
    </Flex>
  );
}
