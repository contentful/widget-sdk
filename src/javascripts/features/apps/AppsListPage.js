import React from 'react';
import PropTypes from 'prop-types';
import { AppsFrameworkIntroBanner } from './AppsFrameworkIntroBanner';
import { css } from 'emotion';
import { get, partition } from 'lodash';

import tokens from '@contentful/forma-36-tokens';
import {
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonText,
  SkeletonImage,
  Notification,
  Heading,
  Note,
  TextLink,
  Card,
  Paragraph,
  Workbench,
  Icon,
} from '@contentful/forma-36-react-components';

import { NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';

import DocumentTitle from 'components/shared/DocumentTitle';
import StateLink from 'app/common/StateLink';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';

import { websiteUrl } from 'Config';

import { AppListItem } from './AppListItem';
import { AppDetailsModal } from './AppDetailsModal';
import * as AppLifecycleTracking from './AppLifecycleTracking';
import { isUsageExceeded, APP_INSTALLATION_LIMIT } from './isUsageExceeded';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const styles = {
  pricingInfo: css({
    marginBottom: tokens.spacingL,
    position: 'relative', // position relative is used to ensure that z-index is applied
    zIndex: 3,
  }),
  workbench: css({
    backgroundColor: tokens.colorElementLightest,
  }),
  appListCard: css({
    position: 'relative',
    marginBottom: tokens.spacingM,
  }),
  overlay: css({
    position: 'absolute',
    zIndex: 2,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: tokens.colorWhite,
    opacity: 0.8,
  }),
  headingWrapper: css({
    display: 'flex',
    alignItems: 'baseline',
  }),
  heading: css({
    marginBottom: tokens.spacingM,
    flexGrow: 1,
  }),
  counter: css({
    color: tokens.colorTextLight,
  }),
  feedbackNote: css({
    marginBottom: tokens.spacingXl,
  }),
  externalLink: css({
    '& svg': css({
      verticalAlign: 'sub',
      marginLeft: tokens.spacing2Xs,
    }),
    '&:hover svg': css({
      fill: tokens.colorContrastMid,
      transition: `fill ${tokens.transitionDurationShort} ${tokens.transitionEasingDefault}`,
    }),
  }),
  footer: css({
    marginBottom: tokens.spacing2Xl,
  }),
};

const externalLinkProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
};

const withInAppHelpUtmParamsPricing = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'pricing-info',
  campaign: 'in-app-help',
});

const withInAppHelpUtmBuildApps = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'build-apps',
  campaign: 'in-app-help',
});

const sortPrivateAppsFirst = (listOfApps, canManageApps) => {
  // only sort private apps first if user can manage them
  if (!canManageApps) {
    return listOfApps;
  }

  const [privApps, pubApps] = partition(listOfApps, (a) => !!a.isPrivateApp);
  return [...privApps, ...pubApps];
};

const openDetailModal = ({ spaceInformation, usageExceeded, canManageApps }) => (app) => {
  AppLifecycleTracking.detailsOpened(app.id);

  ModalLauncher.open(({ isShown, onClose }) => (
    <AppDetailsModal
      isShown={isShown}
      onClose={onClose}
      app={app}
      spaceInformation={spaceInformation}
      usageExceeded={usageExceeded}
      canManageApps={canManageApps}
    />
  ));
};

const Header = () => <Heading>Apps</Heading>;

const PricingInfo = () => (
  <Note
    className={styles.pricingInfo}
    noteType="warning"
    title="Upgrade to our new pricing model to access this feature"
    testId="apps-pricing-info">
    <Paragraph>
      To access this feature, you need to move to the latest version of Spaces. Submit a{' '}
      <TextLink
        href={withInAppHelpUtmParamsPricing(websiteUrl('/support/?upgrade-pricing=true'))}
        {...externalLinkProps}>
        support request
      </TextLink>{' '}
      to get started, or learn more about our{' '}
      <TextLink
        href={withInAppHelpUtmParamsPricing(
          websiteUrl(
            '/pricing/?faq_category=payments-subscriptions&faq=what-type-of-spaces-can-i-have'
          )
        )}
        {...externalLinkProps}>
        Space types and pricing
      </TextLink>
      .
    </Paragraph>
  </Note>
);

const AppsListShell = (props) => (
  <Workbench className={styles.workbench}>
    <Workbench.Header
      title={<Header />}
      icon={<NavigationIcon icon="Apps" size="large" />}
      actions={
        <StateLink path="account.organizations.apps.list" params={{ orgId: props.organizationId }}>
          Manage private apps
        </StateLink>
      }
    />
    <Workbench.Content type="text">
      {props.appsFeatureDisabled && <PricingInfo />}
      {props.appsFeatureDisabled && (
        <div className={styles.overlay} data-test-id="disabled-beta-apps" />
      )}
      <div>{props.children}</div>
    </Workbench.Content>
  </Workbench>
);

AppsListShell.propTypes = {
  appsFeatureDisabled: PropTypes.bool,
  organizationId: PropTypes.string.isRequired,
};

const ItemSkeleton = (props) => (
  <React.Fragment>
    <SkeletonImage offsetTop={props.baseTop} width={36} height={36} radiusX={36} radiusY={36} />
    <SkeletonText offsetTop={props.baseTop + 15} offsetLeft={50} lineHeight={8} width={240} />
    <SkeletonText offsetTop={props.baseTop + 15} offsetLeft={510} lineHeight={8} width={90} />
  </React.Fragment>
);
ItemSkeleton.propTypes = {
  baseTop: PropTypes.number,
};

const AppsListPageLoading = () => {
  return (
    <>
      <SkeletonContainer svgWidth={600} svgHeight={40} ariaLabel="Loading apps list...">
        <SkeletonDisplayText />
      </SkeletonContainer>
      <Card padding="large" className={styles.appListCard}>
        <SkeletonContainer svgWidth={600} svgHeight={150} ariaLabel="Loading apps list...">
          <ItemSkeleton baseTop={0} />
          <ItemSkeleton baseTop={55} />
          <ItemSkeleton baseTop={110} />
        </SkeletonContainer>
      </Card>
    </>
  );
};

export class AppsListPage extends React.Component {
  static propTypes = {
    repo: PropTypes.shape({
      getApps: PropTypes.func.isRequired,
    }).isRequired,
    organizationId: PropTypes.string.isRequired,
    spaceInformation: PropTypes.shape({
      spaceId: PropTypes.string.isRequired,
      spaceName: PropTypes.string.isRequired,
      envMeta: PropTypes.shape({
        environmentId: PropTypes.string.isRequired,
        isMasterEnvironment: PropTypes.bool.isRequired,
        aliasId: PropTypes.string,
      }),
    }).isRequired,
    userId: PropTypes.string.isRequired,
    hasAppsFeature: PropTypes.bool.isRequired,
    deeplinkAppId: PropTypes.string,
    canManageApps: PropTypes.bool,
  };

  state = { ready: false };

  async componentDidMount() {
    try {
      const apps = await this.props.repo.getApps();
      const [installedApps, availableApps] = partition(apps, (app) => !!app.appInstallation);

      this.setState({ ready: true, availableApps, installedApps }, () => {
        this.openDeeplinkedAppDetails();
      });
    } catch (err) {
      Notification.error('Failed to load apps.');
    }
  }

  openDeeplinkedAppDetails() {
    const { deeplinkAppId, hasAppsFeature, spaceInformation, canManageApps } = this.props;

    if (!hasAppsFeature || !deeplinkAppId) {
      return;
    }

    const { installedApps, availableApps } = this.state;

    const deeplinkedApp = installedApps.concat(availableApps).find((app) => {
      // Find either by marketplace ID ("slug", pretty)
      // or definition ID (Contentful UUID, ugly).
      const byMarketplaceId = app.id === deeplinkAppId;
      const definitionId = get(app, ['appDefinition', 'sys', 'id']);
      const byDefinitionId = definitionId === deeplinkAppId;

      return byMarketplaceId || byDefinitionId;
    });

    if (deeplinkedApp && !deeplinkedApp.isPrivateApp) {
      // TODO: we could potentially track the deeplink.
      // Use `this.props.deeplinkReferrer`.
      openDetailModal({
        spaceInformation,
        usageExceeded: isUsageExceeded(installedApps),
        canManageApps,
      })(deeplinkedApp);
    }
  }

  render() {
    const { organizationId, spaceInformation, userId, hasAppsFeature, canManageApps } = this.props;
    const { installedApps, availableApps } = this.state;
    let content = <AppsListPageLoading />;

    if (this.state.ready) {
      const hasInstalledApps = installedApps.length > 0;
      content = (
        <>
          {hasInstalledApps ? (
            <>
              <div className={styles.headingWrapper}>
                <Heading element="h2" className={styles.heading}>
                  Installed
                </Heading>
                <div className={styles.counter}>
                  Usage: {installedApps.length} / {APP_INSTALLATION_LIMIT} apps installed
                </div>
              </div>
              <Card padding="none" className={styles.appListCard}>
                <div data-test-id="installed-list">
                  {sortPrivateAppsFirst(installedApps, canManageApps).map((app) => (
                    <AppListItem
                      key={app.id}
                      app={app}
                      canManageApps={canManageApps}
                      openDetailModal={openDetailModal({ spaceInformation, canManageApps })}
                      orgId={organizationId}
                    />
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <AppsFrameworkIntroBanner canManageApps={canManageApps} />
          )}
          {hasInstalledApps && (
            <Note className={styles.feedbackNote}>
              <TextLink
                target="_blank"
                rel="noopener noreferrer"
                href="https://ctfl.io/apps-feedback">
                Give us feedback!
              </TextLink>{' '}
              Help us improve your experience with our apps and the App Framework.
            </Note>
          )}
          {availableApps.length > 0 && (
            <>
              <Heading element="h2" className={styles.heading}>
                Available
              </Heading>
              <Card padding="none" className={styles.appListCard}>
                <div>
                  {sortPrivateAppsFirst(availableApps, canManageApps).map((app) => (
                    <AppListItem
                      key={app.id}
                      app={app}
                      canManageApps={canManageApps}
                      openDetailModal={openDetailModal({
                        spaceInformation,
                        usageExceeded: isUsageExceeded(installedApps),
                        canManageApps,
                      })}
                      orgId={organizationId}
                    />
                  ))}
                </div>
              </Card>
            </>
          )}
          <Paragraph className={styles.footer}>
            Can&rsquo;t find what you&rsquo;re looking for?{' '}
            <TextLink
              href={withInAppHelpUtmBuildApps(
                'https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/'
              )}
              target="_blank"
              className={styles.externalLink}
              rel="noopener noreferrer">
              Build your own app
              <Icon icon="ExternalLink" />
            </TextLink>
          </Paragraph>
        </>
      );
    }

    return (
      <>
        <DocumentTitle title="Apps" />
        <AppsListShell
          organizationId={organizationId}
          spaceInformation={spaceInformation}
          userId={userId}
          canManageApps={canManageApps}
          appsFeatureDisabled={!hasAppsFeature}>
          {content}
        </AppsListShell>
      </>
    );
  }
}
