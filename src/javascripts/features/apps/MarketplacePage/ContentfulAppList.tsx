import { styles } from './styles';
import { Card, Heading, Paragraph, Button } from '@contentful/forma-36-react-components';
import React from 'react';
import { MarketplaceApp } from 'features/apps-core';
import { AppManager } from '../AppOperations';

interface Props {
  apps: MarketplaceApp[];
  openDetailModal: (app: MarketplaceApp) => Promise<void> | void;
  canManageApps?: boolean;
  appManager: AppManager;
  spaceInformation: {
    spaceId: string;
    envMeta: {
      environmentId: string;
      isMasterEnvironment: boolean;
    };
  };
}

interface ItemProps extends Pick<Props, 'openDetailModal' | 'canManageApps' | 'appManager'> {
  app: MarketplaceApp;
  spaceEnvPath: string;
}

const ContentfulAppListItem = ({
  app,
  openDetailModal,
  canManageApps,
  appManager,
  spaceEnvPath,
}: ItemProps) => {
  const { title, tagLine, icon, appInstallation } = app;
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
                    window.open(`${app.targetUrl}/${spaceEnvPath || ''}`, '_blank');
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
}: Props) => {
  const { spaceId, envMeta } = spaceInformation;

  const spaceEnvPath = `spaces/${spaceId}${
    envMeta.isMasterEnvironment ? '' : `/environments/${envMeta.environmentId}`
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
