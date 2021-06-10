import React from 'react';
import { css } from 'emotion';

const styles = {
  container: css({
    position: 'absolute',
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
    display: 'flex',
    flexDirection: 'column',
  }),
  content: css({
    position: 'relative',
    flex: '1 1 auto',
  }),
};

export function AppContainer({
  children,
  navigation,
}: {
  children: React.ReactNode;
  navigation: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      {navigation}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
