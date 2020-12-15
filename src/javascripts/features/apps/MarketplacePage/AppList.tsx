import { Card, Heading } from '@contentful/forma-36-react-components';
import { styles } from './styles';
import { AppListItem } from './AppListItem';
import { MarketplaceApp } from '../../apps-core';
import React from 'react';

interface AppListProps {
  apps: MarketplaceApp[];
  openDetailModal: (app: MarketplaceApp) => void;
  canManageApps: boolean;
  organizationId: string;
  title: string;
  info?: string;
  testId?: string;
}

export const AppList = ({
  apps,
  openDetailModal,
  canManageApps,
  organizationId,
  title,
  info,
  testId,
}: AppListProps) => {
  return (
    <>
      <div className={styles.headingWrapper}>
        <Heading element="h2" className={styles.heading}>
          {title}
        </Heading>
        {info && <div className={styles.counter}> {info} </div>}
      </div>
      <Card padding="none" className={styles.appListCard}>
        <div data-test-id={testId}>
          {apps.map((app) => (
            <AppListItem
              key={app.id}
              app={app}
              canManageApps={canManageApps}
              openDetailModal={openDetailModal}
              orgId={organizationId}
            />
          ))}
        </div>
      </Card>
    </>
  );
};
