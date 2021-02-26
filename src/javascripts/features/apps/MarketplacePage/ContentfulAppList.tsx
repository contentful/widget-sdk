import { styles } from './styles';
import {
  Card,
  Heading,
  Paragraph,
  Button,
  Flex,
  Typography,
  ModalLauncher,
} from '@contentful/forma-36-react-components';
import React, { ReactElement } from 'react';
import { MarketplaceApp } from 'features/apps-core';
import { go } from 'states/Navigator';
import { beginSpaceCreation } from 'services/CreateSpace';
import { StartAppTrialModal } from 'features/trials';

import { AppManager } from '../AppOperations';
import { SpaceInformation } from '../AppDetailsModal/shared';
import { getContentfulAppUrl } from '../utils';
import { appsMarketingUrl } from 'Config';
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
  isTrialAvailable: boolean;
}

export interface ContentfulAppTileProps {
  slug: string;
  title: string;
  image?: string | ReactElement;
  text?: string;
  organizationId?: string;
  isInstalled?: boolean;
  isPurchased?: boolean;
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
  const appUrl = getContentfulAppUrl(slug, spaceInformation);
  const canBuy = isOwnerOrAdmin({ sys: { id: organizationId } });

  const showInstall = installAction && isPurchased && canManage && !isInstalled;
  const showUninstall = uninstallAction && isInstalled && canManage;
  const showBuyNow = !isPurchased && canBuy && !isTrialAvailable;
  const showTrial = isTrialAvailable && canManage && !isPurchased;
  const showOpen = isInstalled && isPurchased;
  const isSmallCard = isFlipped && !isScreenshot;

  const showModal = () => {
    ModalLauncher.open(({ isShown, onClose }) => (
      <StartAppTrialModal isShown={isShown} onClose={onClose} onConfirm={handleStartAppTrial} />
    ));
  };

  const handleStartAppTrial = () => {
    go({
      path: ['account', 'organizations', 'start_trial'],
      params: { orgId: organizationId, existingUsers: true },
    });
  };

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
            <Typography>
              <Heading element="h3">{title}</Heading>
              <Paragraph>{text}</Paragraph>
            </Typography>

            <div>
              {showOpen && (
                <Button
                  className={styles.button}
                  icon="ExternalLink"
                  onClick={() => {
                    window.open(appUrl);
                  }}>
                  Open
                </Button>
              )}
              {showInstall && (
                <Button testId="install-button" className={styles.button} onClick={installAction}>
                  Start installation
                </Button>
              )}
              {showBuyNow && (
                <Button
                  testId="buy-button"
                  className={styles.button}
                  onClick={() => {
                    if (organizationId) {
                      beginSpaceCreation(organizationId);
                    }
                  }}>
                  Buy now
                </Button>
              )}
              {showTrial && (
                <Button testId="start-trial-button" className={styles.button} onClick={showModal}>
                  Start your free trial
                </Button>
              )}
              {showUninstall && (
                <Button buttonType="muted" className={styles.button} onClick={uninstallAction}>
                  Uninstall
                </Button>
              )}

              <Button
                testId="learn-more-button"
                className={styles.button}
                buttonType="muted"
                icon="ExternalLink"
                onClick={() => {
                  window.open(appsMarketingUrl, '_blank');
                }}>
                Learn more
              </Button>
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
  isTrialAvailable,
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
          title={
            isTrialAvailable || !isPurchased ? 'Compose + Launch free trial' : 'Compose + Launch'
          }
          organizationId={organizationId}
          image={<CombinedIcon />}
          text="Compose and Launch give your content teams powerful new tools that allow them to work faster and collaborate more effectively. None of your content will be affected, and no payment details are needed to start."
          canManage={canManageApps}
          spaceInformation={spaceInformation}
          isInstalled={anyInstalled}
          isPurchased={isPurchased}
          isTrialAvailable={isTrialAvailable}
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
