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
import AdminOnly from 'app/common/AdminOnly';
import DocumentTitle from 'components/shared/DocumentTitle';
import ModalLauncher from 'app/common/ModalLauncher';
import FeedbackDialog from 'app/common/FeedbackDialog';

import { websiteUrl } from 'Config';

import AppListItem from './AppListItem';
import AppDetailsModal from './AppDetailsModal';
import createMicroBackendsClient from 'MicroBackendsClient';
import { getProductCatalogFlagForApp } from './AppProductCatalog';
import * as AppLifecycleTracking from './AppLifecycleTracking';
import StateLink from 'app/common/StateLink';
import createAppsClient from '../apps/AppsClient';

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
    <AppDetailsModal
      isShown={isShown}
      onClose={onClose}
      app={{
        installed: app.installed,
        appId: app.id,
        appName: app.title,
        author: app.author,
        links: app.links,
        icon: app.icon,
        categories: app.categories,
        description: app.description,
        permissions: app.permissions,
        enabled: app.enabled
      }}
    />
  ));
};

const openFeedback = async ({ organizationId, userId }) => {
  const { feedback, canBeContacted } = await ModalLauncher.open(({ isShown, onClose }) => (
    <FeedbackDialog
      key={Date.now()}
      about="Apps"
      isShown={isShown}
      onCancel={() => onClose(false)}
      onConfirm={onClose}
    />
  ));

  if (feedback) {
    const client = createMicroBackendsClient({ backendName: 'feedback' });

    const res = await client.call('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feedback: `Beta apps feedback:\n${feedback}`,
        about: 'Apps',
        target: 'extensibility',
        canBeContacted,
        // add contact details only if user agreed to be contacted
        ...(canBeContacted ? { organizationId, userId } : {})
      })
    });

    if (res.ok) {
      Notification.success('Thank you for your feedback!');
    } else {
      Notification.error("We couldn't send your feedback. Please try again.");
    }
  }
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
          , or <TextLink onClick={() => openFeedback(props)}>share your feedback</TextLink> about
          apps.
        </Note>
      )}
      {props.hasAlphaApps ? (
        <Note noteType="warning" className={styles.intro}>
          Apps alpha is being phased out.{' '}
          <StateLink to="^.^.appsAlpha.list">View apps alpha</StateLink>.<br /> Read the{' '}
          <TextLink
            href={websiteUrl('/developers/docs/extensibility/apps/migrating-from-alpha-to-beta')}
            target="_blank"
            rel="noopener noreferrer">
            migration guide
          </TextLink>{' '}
          to learn how to migrate your currently installed alpha apps.
        </Note>
      ) : null}
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
  appsFeatureDisabled: PropTypes.bool,
  hasAlphaApps: PropTypes.bool
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
      loadProductCatalogFlags: PropTypes.func.isRequired,
      isAppsFeatureDisabled: PropTypes.func.isRequired
    }).isRequired,
    deeplinkAppId: PropTypes.string,
    deeplinkReferrer: PropTypes.string
  };

  state = { ready: false };

  async componentDidMount() {
    try {
      const [apps, hasAlphaApps] = await Promise.all([
        this.props.repo.getApps(),
        // Recover with not showing link to apps alpha
        // This enables us to delete the micro backend without effect after beta release.
        createAppsClient(this.props.spaceId)
          .hasAlphaApps()
          .catch(() => false)
      ]);

      const productCatalogFlags = await this.props.productCatalog.loadProductCatalogFlags(apps);
      const appsFeatureDisabled = await this.props.productCatalog.isAppsFeatureDisabled();

      const preparedApps = apps.map(app => ({
        ...app,
        enabled: getProductCatalogFlagForApp(app, productCatalogFlags)
      }));

      const [installedApps, availableApps] = partition(preparedApps, app => app.installed);

      this.setState(
        {
          ready: true,
          availableApps,
          hasAlphaApps,
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
    return (
      <AdminOnly>
        <DocumentTitle title="Apps" />
        {this.state.ready ? this.renderList() : <AppsListPageLoading />}
      </AdminOnly>
    );
  }

  renderList() {
    const { organizationId, spaceId, userId } = this.props;
    const { installedApps, availableApps, appsFeatureDisabled, hasAlphaApps } = this.state;

    return (
      <AppsListShell
        organizationId={organizationId}
        spaceId={spaceId}
        userId={userId}
        hasAlphaApps={hasAlphaApps}
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
