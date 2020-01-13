import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { partition } from 'lodash';

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
  Paragraph
} from '@contentful/forma-36-react-components';

import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import Icon from 'ui/Components/Icon';
import DocumentTitle from 'components/shared/DocumentTitle';
import ModalLauncher from 'app/common/ModalLauncher';
import StateRedirect from 'app/common/StateRedirect';
import FeedbackButton from 'app/common/FeedbackButton';

import { websiteUrl } from 'Config';
import { getSectionVisibility } from 'access_control/AccessChecker';

import AppListItem from './AppListItem';
import AppDetailsModal from './AppDetailsModal';
import * as AppLifecycleTracking from './AppLifecycleTracking';

const styles = {
  intro: css({
    marginBottom: tokens.spacingL
  }),
  pricingInfo: css({
    marginBottom: tokens.spacingL,
    zIndex: 3
  }),
  workbench: css({
    backgroundColor: tokens.colorElementLightest
  }),
  appListCard: css({
    position: 'relative'
  }),
  overlay: css({
    position: 'absolute',
    zIndex: 2,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: tokens.colorWhite,
    opacity: 0.8
  })
};

const externalLinkProps = {
  target: '_blank',
  rel: 'noopener noreferrer'
};

const openDetailModal = app => {
  AppLifecycleTracking.detailsOpened(app.id);

  ModalLauncher.open(({ isShown, onClose }) => (
    <AppDetailsModal isShown={isShown} onClose={onClose} app={app} />
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
      <TextLink href={websiteUrl('/support/?upgrade-pricing=true')} {...externalLinkProps}>
        support request
      </TextLink>{' '}
      to get started, or learn more about our{' '}
      <TextLink
        href={websiteUrl(
          '/pricing/?faq_category=payments-subscriptions&faq=what-type-of-spaces-can-i-have'
        )}
        {...externalLinkProps}>
        Space types and pricing
      </TextLink>
      .
    </Paragraph>
  </Note>
);

const AppsListShell = props => (
  <Workbench className={styles.workbench}>
    <Workbench.Header
      title={<Header />}
      icon={<Icon name="page-apps" scale="1" />}
      actions={
        <TextLink
          href={websiteUrl('/developers/docs/extensibility/apps/')}
          target="_blank"
          rel="noopener noreferrer">
          View documentation
        </TextLink>
      }
    />
    <Workbench.Content type="text">
      {props.appsFeatureDisabled ? (
        <PricingInfo />
      ) : (
        <Note className={styles.intro}>
          Let us know if you want to{' '}
          <TextLink
            href="https://forms.gle/3U15mGcRMy4NkcCg6"
            target="_blank"
            rel="noopener noreferrer">
            build an app
          </TextLink>
          , or <FeedbackButton target="extensibility" about="Apps" label="share your feedback" />{' '}
          about apps.
        </Note>
      )}
      <Card padding="large" className={styles.appListCard}>
        {props.appsFeatureDisabled && (
          <div className={styles.overlay} data-test-id="disabled-beta-apps" />
        )}
        <Paragraph className={styles.intro}>
          Contentful apps extend and expand the capabilities of the Contentful web app. You can
          integrate your favorite third-party services, build better workflows and customize what
          you can do with Contentful.
        </Paragraph>
        <div>{props.children}</div>
      </Card>
    </Workbench.Content>
  </Workbench>
);

AppsListShell.propTypes = {
  appsFeatureDisabled: PropTypes.bool
};

const ItemSkeleton = props => (
  <React.Fragment>
    <SkeletonImage offsetTop={props.baseTop} width={36} height={36} radiusX={36} radiusY={36} />
    <SkeletonText offsetTop={props.baseTop + 15} offsetLeft={50} lineHeight={8} width={240} />
    <SkeletonText offsetTop={props.baseTop + 15} offsetLeft={510} lineHeight={8} width={90} />
  </React.Fragment>
);
ItemSkeleton.propTypes = {
  baseTop: PropTypes.number
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
      getApps: PropTypes.func.isRequired
    }).isRequired,
    organizationId: PropTypes.string.isRequired,
    spaceId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    productCatalog: PropTypes.shape({
      isAppEnabled: PropTypes.func.isRequired
    }).isRequired,
    deeplinkAppId: PropTypes.string,
    deeplinkReferrer: PropTypes.string
  };

  state = { ready: false };

  async componentDidMount() {
    const { repo, productCatalog } = this.props;

    try {
      const apps = await repo.getApps();

      const preparedApps = await Promise.all(
        apps.map(async app => ({
          ...app,
          enabled: await productCatalog.isAppEnabled(app.appDefinition)
        }))
      );

      const appsFeatureDisabled = preparedApps.every(app => !app.enabled);

      const [installedApps, availableApps] = partition(preparedApps, app => !!app.appInstallation);

      this.setState(
        {
          ready: true,
          availableApps,
          installedApps,
          appsFeatureDisabled
        },
        () => {
          this.openDeeplinkedAppDetails();
        }
      );
    } catch (err) {
      Notification.error('Failed to load apps.');
    }
  }

  openDeeplinkedAppDetails() {
    if (this.props.deeplinkAppId && !this.state.appsFeatureDisabled) {
      const apps = this.state.installedApps.concat(this.state.availableApps);
      const deeplinkedApp = apps.find(app => app.id === this.props.deeplinkAppId);

      if (deeplinkedApp) {
        // TODO: we could potentially track the deeplink.
        // Use `this.props.deeplinkReferrer`.
        openDetailModal(deeplinkedApp);
      }
    }
  }

  render() {
    if (!getSectionVisibility()['apps']) {
      return <StateRedirect to="spaces.detail.entries.list" />;
    }

    return (
      <>
        <DocumentTitle title="Apps" />
        {this.state.ready ? this.renderList() : <AppsListPageLoading />}
      </>
    );
  }

  renderList() {
    const { organizationId, spaceId, userId } = this.props;
    const { installedApps, availableApps, appsFeatureDisabled } = this.state;

    return (
      <AppsListShell
        organizationId={organizationId}
        spaceId={spaceId}
        userId={userId}
        appsFeatureDisabled={appsFeatureDisabled}>
        {installedApps.length > 0 && (
          <>
            <Heading element="h2">Installed</Heading>
            <div data-test-id="installed-list">
              {installedApps.map(app => (
                <AppListItem key={app.id} app={app} openDetailModal={openDetailModal} />
              ))}
            </div>
          </>
        )}
        <hr />
        <Heading element="h2">Available</Heading>
        {availableApps.length > 0 && (
          <div>
            {availableApps.map(app => (
              <AppListItem key={app.id} app={app} openDetailModal={openDetailModal} />
            ))}
          </div>
        )}
      </AppsListShell>
    );
  }
}
