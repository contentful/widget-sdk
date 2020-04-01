import React from 'react';
import PropTypes from 'prop-types';
import AppsFrameworkIntroBanner from './AppsFrameworkIntroBanner';
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
} from '@contentful/forma-36-react-components';

import NavigationIcon from 'ui/Components/NavigationIcon';

import DocumentTitle from 'components/shared/DocumentTitle';
import ModalLauncher from 'app/common/ModalLauncher';
import FeedbackButton from 'app/common/FeedbackButton';

import { websiteUrl } from 'Config';

import AppListItem from './AppListItem';
import AppDetailsModal from './AppDetailsModal';
import * as AppLifecycleTracking from './AppLifecycleTracking';
import { isUsageExceeded } from './isUsageExceeded';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const styles = {
  pricingInfo: css({
    marginBottom: tokens.spacingL,
    zIndex: 3,
  }),
  workbench: css({
    backgroundColor: tokens.colorElementLightest,
  }),
  appListCard: css({
    position: 'relative',
    marginBottom: tokens.spacingL,
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
  installedList: css({
    marginBottom: tokens.spacing2Xl,
  }),
};

const externalLinkProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
};

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'pricing-info',
  campaign: 'in-app-help',
});

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
        href={withInAppHelpUtmParams(websiteUrl('/support/?upgrade-pricing=true'))}
        {...externalLinkProps}>
        support request
      </TextLink>{' '}
      to get started, or learn more about our{' '}
      <TextLink
        href={withInAppHelpUtmParams(
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
      icon={<NavigationIcon icon="apps" color="green" size="large" />}
      actions={<FeedbackButton target="extensibility" about="Apps" label="Give your feedback" />}
    />
    <Workbench.Content type="text">
      <AppsFrameworkIntroBanner canManageApps={props.canManageApps} />
      {props.appsFeatureDisabled && <PricingInfo />}
      <Card padding="large" className={styles.appListCard}>
        {props.appsFeatureDisabled && (
          <div className={styles.overlay} data-test-id="disabled-beta-apps" />
        )}
        <div>{props.children}</div>
      </Card>
    </Workbench.Content>
  </Workbench>
);

AppsListShell.propTypes = {
  appsFeatureDisabled: PropTypes.bool,
  canManageApps: PropTypes.bool,
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
    <AppsListShell>
      <SkeletonContainer svgWidth={600} svgHeight={200} ariaLabel="Loading apps list...">
        <SkeletonDisplayText />
        <ItemSkeleton baseTop={60} />
        <ItemSkeleton baseTop={110} />
        <ItemSkeleton baseTop={160} />
      </SkeletonContainer>
    </AppsListShell>
  );
};

export default class AppsListPage extends React.Component {
  static propTypes = {
    goToContent: PropTypes.func.isRequired,
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
    deeplinkReferrer: PropTypes.string,
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
    return (
      <>
        <DocumentTitle title="Apps" />
        {this.state.ready ? this.renderList() : <AppsListPageLoading />}
      </>
    );
  }

  renderList() {
    const { organizationId, spaceInformation, userId, hasAppsFeature, canManageApps } = this.props;
    const { installedApps, availableApps } = this.state;
    const { spaceId } = spaceInformation;
    const usageExceeded = isUsageExceeded(installedApps);

    return (
      <AppsListShell
        organizationId={organizationId}
        spaceId={spaceId}
        userId={userId}
        canManageApps={canManageApps}
        appsFeatureDisabled={!hasAppsFeature}>
        {installedApps.length > 0 && (
          <>
            <Heading element="h2">Installed</Heading>
            <div data-test-id="installed-list" className={styles.installedList}>
              {installedApps.map((app) => (
                <AppListItem
                  key={app.id}
                  app={app}
                  canManageApps={canManageApps}
                  openDetailModal={openDetailModal({ spaceInformation, canManageApps })}
                />
              ))}
            </div>
          </>
        )}
        <Heading element="h2">Available</Heading>
        {availableApps.length > 0 && (
          <div>
            {availableApps.map((app) => (
              <AppListItem
                key={app.id}
                app={app}
                canManageApps={canManageApps}
                openDetailModal={openDetailModal({
                  spaceInformation,
                  usageExceeded,
                  canManageApps,
                })}
              />
            ))}
          </div>
        )}
      </AppsListShell>
    );
  }
}
