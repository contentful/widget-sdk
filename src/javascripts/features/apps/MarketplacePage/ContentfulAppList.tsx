import { styles } from './styles';
import { Card, Heading, Paragraph, Button } from '@contentful/forma-36-react-components';
import React from 'react';
import StateLink from 'app/common/StateLink';

const ContentfulAppListItem = ({ app, openDetailModal, canManageApps }) => {
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
                    window.open(app.targetUrl, '_blank');
                  }}>
                  Open
                </Button>
                {canManageApps && (
                  <StateLink path="^.detail" params={{ appId: app.id }}>
                    {({ onClick }) => (
                      <Button onClick={onClick} buttonType="muted" className={styles.button}>
                        Uninstall
                      </Button>
                    )}
                  </StateLink>
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

export const ContentfulAppsList = ({ openDetailModal, apps, canManageApps }) => {
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
          openDetailModal={openDetailModal}
          canManageApps={canManageApps}
          key={key}
        />
      ))}
      <hr className={styles.splitter} />
    </>
  );
};
