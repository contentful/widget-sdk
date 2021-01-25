import React from 'react';
import { Spinner } from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  overlay: css({
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    background: 'rgba(255,255,255,.8)',
    top: 0,
    left: 0,
    zIndex: tokens.zIndexNotification,
  }),
  message: css({
    fontSize: tokens.fontSizeL,
    fontWeight: tokens.fontWeightDemiBold,
  }),
};

interface ReleasesLoadingOverlayProps {
  message: string;
}

export const ReleasesLoadingOverlay = ({ message }: ReleasesLoadingOverlayProps): React.ReactElement => {
  return (
    <div className={styles.overlay}>
      <EmptyStateContainer>
        <Flex
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          fullHeight
          fullWidth
          testId={'releases-overlay'}>
          <Spinner size="large" color="primary" />
          <Flex marginTop="spacingM">
            <span className={styles.message}>{message}</span>
          </Flex>
        </Flex>
      </EmptyStateContainer>
    </div>
  );
};
