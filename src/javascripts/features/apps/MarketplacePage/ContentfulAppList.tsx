import { styles } from './styles';
import { Card, Heading, Paragraph, Button } from '@contentful/forma-36-react-components';
import React from 'react';
import { AppManager } from '../AppOperations';
import { MarketplaceApp } from 'features/apps-core';
import { SpaceInformation } from '../AppDetailsModal/shared';

interface ListProps {
  apps: MarketplaceApp[];
  openDetailModal: (app: MarketplaceApp) => void;
  canManageApps: boolean;
  appManager: AppManager;
  spaceInformation: SpaceInformation;
}

interface ItemProps extends Omit<ListProps, 'apps' | 'spaceInformation'> {
  app: MarketplaceApp;
  spaceEnvPath?: string;
}

const ContentfulAppListItem = ({
  app,
  openDetailModal,
  canManageApps,
  appManager,
  spaceEnvPath = '/',
}: ItemProps) => {
  const { title, tagLine, icon, appInstallation, targetUrl } = app;
  const targetUrlWithSpacePath = new URL(spaceEnvPath, targetUrl).toString();
  return (
    <Card padding="default" className={styles.appListCard}>
      <div className={styles.contentfulAppCard}>
        <div className={styles.contentfulAppIcon}>
          <img src={icon} alt={'Icon for ' + title} />
        </div>
        <div className={styles.contentfulAppTextWrapper}>
          <div className={styles.contentfulAppText}>
            <Heading element="h3">{title}</Heading>
            <Paragraph>{tagLine}</Paragraph>

            {appInstallation ? (
              <div>
                <Button
                  className={styles.button}
                  icon="ExternalLink"
                  onClick={() => {
                    window.open(targetUrlWithSpacePath, '_blank');
                  }}>
                  Open
                </Button>
                {canManageApps && (
                  <Button
                    onClick={() => {
                      appManager.showUninstall(app);
                    }}
                    buttonType="muted"
                    className={styles.button}>
                    Uninstall
                  </Button>
                )}
              </div>
            ) : (
              <Button className={styles.button} onClick={() => openDetailModal(app)}>
                Install
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export const ContentfulAppsList = ({
  openDetailModal,
  apps,
  canManageApps,
  appManager,
  spaceInformation,
}: ListProps) => {
  const { isMasterEnvironment, environmentId } = spaceInformation.envMeta;
  const spaceEnvPath = `/spaces/${spaceInformation.spaceId}${
    isMasterEnvironment ? '' : `/environments/${environmentId}`
  }`;

  return (
    <>
      <div className={styles.headingWrapper}>
        <Heading element="h2" className={styles.heading}>
          Contentful apps
        </Heading>
      </div>
      {apps.map((app, key) => (
        <ContentfulAppListItem
          app={app}
          appManager={appManager}
          openDetailModal={openDetailModal}
          canManageApps={canManageApps}
          key={key}
          spaceEnvPath={spaceEnvPath}
        />
      ))}
      <hr className={styles.splitter} />
    </>
  );
};
