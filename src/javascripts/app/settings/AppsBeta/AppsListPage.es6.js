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
  Card
} from '@contentful/forma-36-react-components';

import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import Icon from 'ui/Components/Icon.es6';
import AdminOnly from 'app/common/AdminOnly.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import * as Telemetry from 'i13n/Telemetry.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import FeedbackDialog from 'app/common/FeedbackDialog.es6';
import createMicroBackendsClient from 'MicroBackendsClient.es6';

import AppListItem from './AppListItem.es6';
import AppDetailsModal from './AppDetailsModal.es6';

const styles = {
  intro: css({
    marginBottom: tokens.spacingL
  }),
  betaLabel: css({
    marginRight: tokens.spacingS,
    background: tokens.colorBlueDark,
    color: tokens.colorWhite,
    padding: tokens.spacing2Xs,
    letterSpacing: tokens.letterSpacingWide,
    lineHeight: '0.65rem',
    fontSize: '0.65rem',
    borderRadius: '3px',
    textTransform: 'uppercase'
  }),
  workbench: css({
    backgroundColor: tokens.colorElementLightest
  })
};

const openDetailModal = app => {
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
        permissions: app.permissions
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

const Header = () => (
  <Heading>
    Apps <span className={styles.betaLabel}>Beta</span>
  </Heading>
);

const AppsListShell = props => (
  <Workbench className={styles.workbench}>
    <Workbench.Header title={<Header />} icon={<Icon name="page-apps" scale="1" />} />
    <Workbench.Content type="text">
      <Note className={styles.intro}>
        Share your feedback about apps.{' '}
        <TextLink onClick={() => openFeedback(props)}>Give feedback</TextLink>
      </Note>
      <Card padding="large">
        <p className={styles.intro}>
          Apps help you extend functionality and easily connect with other services you are using.
        </p>
        <div>{props.children}</div>
      </Card>
    </Workbench.Content>
  </Workbench>
);

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

const prepareApp = repoApps => app => ({
  id: app.fields.slug,
  title: app.fields.title,
  tagLine: app.fields.tagLine,
  description: app.fields.description,
  icon: app.fields.icon.fields.file.url,
  author: {
    name: app.fields.developer.fields.name,
    url: app.fields.developer.fields.websiteUrl,
    icon: app.fields.developer.fields.icon.fields.file.url
  },
  links: app.fields.links.map(link => link.fields),
  categories: app.fields.categories.map(c => c.fields.name),
  permissions: app.fields.permissionsExplanation,
  installed: !!(repoApps.find(a => a.sys.id === app.fields.slug) || {}).extension
});

const prepareDevApp = app => ({
  id: app.sys.id,
  title: app.extensionDefinition.name,
  installed: !!app.extension,
  isDevApp: true
});

export default class AppsListPage extends React.Component {
  static propTypes = {
    goToContent: PropTypes.func.isRequired,
    repo: PropTypes.shape({
      getApps: PropTypes.func.isRequired,
      getDevApps: PropTypes.func.isRequired,
      getAppsListing: PropTypes.func.isRequired
    }).isRequired,
    organizationId: PropTypes.string.isRequired,
    spaceId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired
  };

  state = {};

  async componentDidMount() {
    try {
      const [repoApps, appsListing, devApps] = await Promise.all([
        this.props.repo.getApps(),
        this.props.repo.getAppsListing(),
        this.props.repo.getDevApps()
      ]);

      const preparedApps = Object.values(appsListing).map(prepareApp(repoApps, appsListing));
      const preparedDevApps = devApps.map(prepareDevApp);
      const [installedApps, availableApps] = partition(
        [...preparedApps, ...preparedDevApps],
        app => app.installed
      );

      this.setState({
        ready: true,
        availableApps,
        installedApps,
        appsListing
      });
    } catch (err) {
      Telemetry.count('apps.list-loading-failed');
      Notification.error('Failed to load apps.');
      this.props.goToContent();
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
    const { installedApps, availableApps } = this.state;

    return (
      <AppsListShell organizationId={organizationId} spaceId={spaceId} userId={userId}>
        {installedApps.length > 0 && (
          <>
            <Heading element="h2">Installed</Heading>
            <div>
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
