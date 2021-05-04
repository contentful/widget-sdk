import { Workbench } from '@contentful/forma-36-react-components';
import Icon from 'ui/Components/Icon';
import React, { ReactNode } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

type JobsListShell = {
  children: ReactNode;
};

const styles = {
  workbenchContent: css({
    padding: tokens.spacingXl,
  }),
};

const JobsListShell = ({ children }: JobsListShell) => (
  <Workbench>
    <Workbench.Header
      icon={<Icon name="schedule-calendar" scale={0.75} />}
      title="Scheduled Content"
      onBack={() => {
        window.history.back();
      }}
    />
    <Workbench.Content type="text" className={styles.workbenchContent}>
      <div>{children}</div>
    </Workbench.Content>
  </Workbench>
);

export { JobsListShell };
