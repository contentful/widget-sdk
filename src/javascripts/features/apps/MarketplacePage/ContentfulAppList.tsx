import { styles } from './styles';
import { Card, Heading, Paragraph, Button, Flex } from '@contentful/forma-36-react-components';
import React, { ReactElement } from 'react';
import { AppManager } from '../AppOperations';
import { MarketplaceApp } from 'features/apps-core';
import { SpaceInformation } from '../AppDetailsModal/shared';
import { domain } from 'Config';
import { beginSpaceCreation } from 'services/CreateSpace';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';

import CombinedIcon from 'svg/illustrations/launch-compose-combined.svg';

interface ListProps {
  apps: MarketplaceApp[];
  openDetailModal: (app: MarketplaceApp) => void;
  canManageApps: boolean;
  appManager: AppManager;
  spaceInformation: SpaceInformation;
  organizationId: string;
  isPurchased: boolean;
}

interface ContentfulAppTileProps {
  slug: string;
  title: string;
  image?: string | ReactElement;
  text?: string;
  organizationId: string;
  isInstalled: boolean;
  isPurchased: boolean;
  canManage: boolean;
  isTrialAvailable?: boolean;
  spaceInformation: SpaceInformation;
  // These only change the styling
  isFlipped?: boolean;
  isScreenshot?: boolean;
  // Not passing these will prevent the relevant buttons from being shown
  installAction?: () => void;
  uninstallAction?: () => void;
}

export const ContentfulAppTile = ({
  slug,
  image,
  title,
  text,
  organizationId,
  isInstalled,
  isPurchased,
  isTrialAvailable = false,
  canManage,
  spaceInformation,
  installAction,
  uninstallAction,
  isFlipped = false,
  isScreenshot = false,
}: ContentfulAppTileProps) => {
  const baseUrl = `https://${slug}.${domain}`;
  const { isMasterEnvironment, environmentId } = spaceInformation.envMeta;
  const canBuy = isOwnerOrAdmin({ sys: { id: organizationId } });
  const spaceEnvPath = `/spaces/${spaceInformation.spaceId}${
    isMasterEnvironment ? '' : `/environments/${environmentId}`
  }`;

  const showInstall = installAction && isPurchased && canManage && !isInstalled;
  const showUninstall = uninstallAction && isInstalled && canManage;
  const showLearnMore = !isInstalled && !(isPurchased && canManage);
  const showBuyNow = !isPurchased && canBuy && !isTrialAvailable;
  const showTrial = isTrialAvailable && canManage && !isPurchased;
  const showOpen = isInstalled && isPurchased;

  const isSmallCard = isFlipped && !isScreenshot;

  return (
    <Card padding={isScreenshot ? 'none' : 'large'} className={styles.appListCard}>
      <Flex
        alignItems="center"
        flexDirection={isFlipped ? 'row-reverse' : 'row'}
        justifyContent={isScreenshot || isFlipped ? 'space-between' : 'initial'}>
        <div className={styles.contentfulAppIcon(isScreenshot)}>
          {typeof image === 'string' ? <img src={image} alt="" /> : <>{image}</>}
        </div>
        <div className={styles.contentfulAppTextWrapper(isSmallCard)}>
          <div className={styles.contentfulAppText}>
            <Heading element="h3">{title}</Heading>
            <Paragraph>{text}</Paragraph>

            <div>
              {showOpen && (
                <Button
                  className={styles.button}
                  icon="ExternalLink"
                  onClick={() => {
                    window.open(new URL(spaceEnvPath, baseUrl).toString(), '_blank');
                  }}>
                  Open
                </Button>
              )}
              {showInstall && (
                <Button className={styles.button} onClick={installAction}>
                  Install
                </Button>
              )}
              {showBuyNow && (
                <Button
                  className={styles.button}
                  onClick={() => {
                    beginSpaceCreation(organizationId);
                  }}>
                  Buy now
                </Button>
              )}
              {showTrial && (
                <Button
                  className={styles.button}
                  onClick={() => {
                    // TODO This should show a modal that calls the relevant APIs
                    // TODO "isTrialAvailable" should be determined beforehand
                    // Team MOI is working on it.
                  }}>
                  Start 10 day trial
                </Button>
              )}
              {showUninstall && (
                <Button buttonType="muted" className={styles.button} onClick={uninstallAction}>
                  Uninstall
                </Button>
              )}
              {showLearnMore && (
                <Button
                  className={styles.button}
                  buttonType="muted"
                  icon="ExternalLink"
                  onClick={() => {
                    window.open('https://www.contentful.com/contentful-apps/', '_blank');
                  }}>
                  Learn more
                </Button>
              )}
            </div>
          </div>
        </div>
      </Flex>
    </Card>
  );
};

export const ContentfulAppsList = ({
  openDetailModal,
  apps,
  canManageApps,
  appManager,
  spaceInformation,
  isPurchased,
  organizationId,
}: ListProps) => {
  const anyInstalled = apps.some((app) => app.appInstallation);
  const isCombinedTile = !isPurchased && !anyInstalled;

  // We assume amount of apps is controlled through LaunchDarkly flags
  // and we should hide the listing if the flags are all disabled
  return apps.length ? (
    <>
      <div className={styles.headingWrapper}>
        <Heading element="h2" className={styles.heading}>
          Contentful apps
        </Heading>
      </div>
      {isCombinedTile ? (
        <ContentfulAppTile
          slug="app"
          title="Compose + Launch"
          organizationId={organizationId}
          image={<CombinedIcon />}
          text="Compose and Launch will elevate the experience of your content team, while creating and publishing all your best content."
          canManage={canManageApps}
          spaceInformation={spaceInformation}
          isInstalled={anyInstalled}
          isPurchased={isPurchased}
        />
      ) : (
        apps.map((app, key) => (
          <ContentfulAppTile
            image={app.icon}
            title={app.title}
            text={app.tagLine}
            organizationId={organizationId}
            slug={app.id}
            canManage={canManageApps}
            key={key}
            spaceInformation={spaceInformation}
            isInstalled={Boolean(app.appInstallation)}
            isPurchased={isPurchased}
            installAction={() => {
              openDetailModal(app);
            }}
            uninstallAction={() => {
              appManager.showUninstall(app);
            }}
          />
        ))
      )}
      <hr className={styles.splitter} />
    </>
  ) : null;
};
