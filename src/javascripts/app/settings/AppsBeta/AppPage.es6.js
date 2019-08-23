import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css, keyframes } from 'emotion';
import { get } from 'lodash';
import tokens from '@contentful/forma-36-tokens';
import {
  Button,
  Notification,
  Spinner,
  Paragraph,
  Heading,
  SkeletonContainer,
  SkeletonBodyText
} from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';

import AdminOnly from 'app/common/AdminOnly.es6';
import ExtensionIFrameRenderer from 'widgets/ExtensionIFrameRenderer.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import * as Telemetry from 'i13n/Telemetry.es6';
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer.es6';
import EmptyStateIllustration from 'svg/connected-forms-illustration.es6';
import { installOrUpdate, uninstall } from './AppOperations.es6';
import { APP_EVENTS_IN, APP_EVENTS_OUT } from './AppHookBus.es6';
import UninstallModal from './UninstallModal.es6';
import AppPermissions from './AppPermissions.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import ClientStorage from 'TheStore/ClientStorage.es6';

import { websiteUrl } from 'Config.es6';

const sessionStorage = ClientStorage('session');

const BUSY_STATE_INSTALLATION = 'installation';
const BUSY_STATE_UPDATE = 'update';
const BUSY_STATE_UNINSTALLATION = 'uninstallation';

const BUSY_STATE_TO_TEXT = {
  [BUSY_STATE_INSTALLATION]: 'Installing the app...',
  [BUSY_STATE_UPDATE]: 'Updating configuration...',
  [BUSY_STATE_UNINSTALLATION]: 'Uninstalling the app...'
};

const fadeIn = keyframes({
  from: {
    transform: 'translateY(50px)',
    opacity: '0'
  },
  to: {
    transform: 'translateY(0)',
    opacity: '1'
  }
});

const styles = {
  renderer: css({
    padding: 0,
    animation: `${fadeIn} 0.8s ease`,
    '> div': {
      height: '100%',
      width: '100%'
    }
  }),
  actionButton: css({
    marginLeft: tokens.spacingM
  }),
  overlay: css({
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    position: 'fixed',
    zIndex: 9999,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center'
  }),
  busyText: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '50px',
    fontSize: '24px',
    backgroundColor: 'white',
    letterSpacing: '1px'
  }),
  overlayPill: css({
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }),
  spinner: css({
    marginRight: tokens.spacingS
  }),
  appIcon: css({
    marginRight: tokens.spacingXs,
    verticalAlign: 'middle'
  }),
  appPermissions: css({
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    paddingTop: '100px'
  }),
  icon: css({
    width: '45px',
    height: '45px',
    verticalAlign: 'middle',
    marginRight: tokens.spacingS
  })
};

function isAppAlreadyAuthorized(repo, appId) {
  if (repo.isDevApp(appId)) {
    return true;
  }

  try {
    const perms = JSON.parse(sessionStorage.get('appPermissions'));

    return perms[appId] || false;
  } catch (e) {
    return false;
  }
}

export default class AppRoute extends Component {
  static propTypes = {
    goBackToList: PropTypes.func.isRequired,
    appId: PropTypes.string.isRequired,
    productCatalog: PropTypes.shape({
      isAppEnabled: PropTypes.func.isRequired
    }),
    repo: PropTypes.shape({
      getExtensionDefinitionForApp: PropTypes.func.isRequired,
      getExtensionForExtensionDefinition: PropTypes.func.isRequired,
      getAppsListing: PropTypes.func.isRequired
    }).isRequired,
    bridge: PropTypes.object.isRequired,
    appHookBus: PropTypes.shape({
      on: PropTypes.func.isRequired,
      emit: PropTypes.func.isRequired,
      setExtension: PropTypes.func.isRequired
    }).isRequired,
    cma: PropTypes.shape({
      getExtension: PropTypes.func.isRequired,
      createExtension: PropTypes.func.isRequired,
      updateExtension: PropTypes.func.isRequired,
      deleteExtension: PropTypes.func.isRequired
    }).isRequired,
    extensionLoader: PropTypes.shape({
      cacheExtension: PropTypes.func.isRequired,
      evictExtension: PropTypes.func.isRequired
    })
  };

  state = {
    ready: false,
    acceptedPermissions: isAppAlreadyAuthorized(this.props.repo, this.props.appId)
  };

  // There are no parameters in the app location
  parameters = {
    installation: {},
    instance: {}
  };

  async componentDidMount() {
    try {
      await this.initialize();
    } catch (err) {
      Telemetry.count('apps.app-loading-failed');
      Notification.error('Failed to load the app.');
      this.props.goBackToList();
    }
  }

  checkAppStatus = async extensionDefinition => {
    extensionDefinition = extensionDefinition || this.state.extensionDefinition;

    const { repo, appId } = this.props;
    const result = { appId, extensionDefinition };

    try {
      return {
        ...result,
        extension: await repo.getExtensionForExtensionDefinition(extensionDefinition.sys.id)
      };
    } catch (err) {
      // If there are 2 or more extensions for the same definition
      // we cannot reliably tell which one is managed by the App.
      // For the time being we just ask the customer to contact us.
      // I think this is very unlikely to ever happen (requires manual
      // API entity modification).
      if (err.extensionCount > 1) {
        Telemetry.count('apps.non-unique-app-extension');
        Notification.error('The app has crashed. Please contact support.');
        this.props.goBackToList();
      }

      return result;
    }
  };

  initialize = async () => {
    const { appHookBus, appId, repo, productCatalog } = this.props;

    const [extensionDefinition, appsListing] = await Promise.all([
      repo.getExtensionDefinitionForApp(appId),
      repo.getAppsListing()
    ]);

    const appInfo = Object.values(appsListing).find(app => app.fields.slug === appId);

    const [{ extension }, appEnabled] = await Promise.all([
      this.checkAppStatus(extensionDefinition),
      productCatalog.isAppEnabled(appInfo)
    ]);

    appHookBus.setExtension(extension);
    appHookBus.on(APP_EVENTS_IN.CONFIGURED, this.onAppConfigured);
    appHookBus.on(APP_EVENTS_IN.MISCONFIGURED, this.onAppMisconfigured);

    this.setState({
      ready: true,
      appEnabled,
      isInstalled: !!extension,
      extensionDefinition,
      title: get(appInfo, ['fields', 'title'], extensionDefinition.name),
      appIcon: get(appInfo, ['fields', 'icon', 'fields', 'file', 'url'], '')
    });
  };

  onAppConfigured = async ({ installationRequestId, config }) => {
    const { cma, extensionLoader, appHookBus } = this.props;

    try {
      await installOrUpdate(cma, extensionLoader, this.checkAppStatus, config);

      // Verify if installation was completed.
      const { extension } = await this.checkAppStatus();
      if (!extension) {
        // For whatever reason Extension entity wasn't created.
        throw new Error('Extension does not exist.');
      }

      if (this.state.busyWith === BUSY_STATE_UPDATE) {
        Notification.success('App configuration was updated successfully.');
      } else {
        Notification.success('The app was installed successfully.');
      }

      this.setState({ isInstalled: true, busyWith: false });

      appHookBus.setExtension(extension);
      appHookBus.emit(APP_EVENTS_OUT.SUCCEEDED, { installationRequestId });
    } catch (err) {
      if (this.state.busyWith === BUSY_STATE_UPDATE) {
        Notification.error('Failed to update app configuration.');
      } else {
        Notification.error('Failed to install the app.');
      }

      const { extension } = await this.checkAppStatus();
      this.setState({ isInstalled: !!extension, busyWith: false });

      appHookBus.setExtension(extension);
      appHookBus.emit(APP_EVENTS_OUT.FAILED, { installationRequestId });
    }
  };

  onAppMisconfigured = async () => {
    const { extension } = await this.checkAppStatus();
    this.setState({ isInstalled: !!extension, busyWith: false });
  };

  update = busyWith => {
    this.setState({ busyWith });
    this.props.appHookBus.emit(APP_EVENTS_OUT.STARTED);
  };

  uninstall = () => {
    return ModalLauncher.open(({ isShown, onClose }) => (
      <UninstallModal
        key={Date.now()}
        isShown={isShown}
        appName={this.state.title}
        actionList={[]} // todo: EXT-933 add the action list from the app's JSON config
        onConfirm={reasons => {
          onClose(true);
          this.uninstallApp(reasons);
        }}
        onClose={() => {
          onClose(true);
        }}
      />
    ));
  };

  // todo: EXT-933 This function is passed a `reasons` array argument which we can use
  // to track reasons for uninstalling apps
  uninstallApp = async (/* reasons */) => {
    const { cma, extensionLoader } = this.props;

    this.setState({ busyWith: BUSY_STATE_UNINSTALLATION });

    // Unset extension immediately so its parameters are not exposed
    // via the SDK as soon as the proces was initiated.
    this.props.appHookBus.setExtension(null);

    try {
      await uninstall(cma, extensionLoader, this.checkAppStatus);

      // Verify if uninstallation was completed.
      const { extension } = await this.checkAppStatus();
      if (extension) {
        throw new Error('Extension still exists.');
      }

      Notification.success('The app was uninstalled successfully.');
    } catch (err) {
      Notification.error('Failed to fully uninstall the app.');
    }

    this.props.goBackToList();
  };

  renderAccessDenied() {
    return (
      <Workbench>
        <Workbench.Header title={this.renderTitle()} onBack={this.props.goBackToList} />
        <Workbench.Content type="text">
          <EmptyStateContainer data-test-id="extensions.empty">
            <div className={defaultSVGStyle}>
              <EmptyStateIllustration />
            </div>
            <Heading>Not included in your pricing plan</Heading>
            <Paragraph>This app is available to customers on a committed, annual plan.</Paragraph>
            <Paragraph>
              If your interested in learning more about our expanded, enterprise-grade platform,
              contact your account manager.
            </Paragraph>

            <Button href={websiteUrl('/support/?upgrade-pricing=true')}>Contact us</Button>
          </EmptyStateContainer>
        </Workbench.Content>
      </Workbench>
    );
  }

  renderBusyOverlay() {
    if (!this.state.busyWith) {
      return null;
    }

    return (
      <div className={styles.overlay}>
        <div className={styles.overlayPill}>
          <Paragraph className={styles.busyText}>
            <Spinner size="large" className={styles.spinner} />{' '}
            {BUSY_STATE_TO_TEXT[this.state.busyWith]}
          </Paragraph>
        </div>
      </div>
    );
  }

  renderTitle() {
    if (!this.state.appIcon) {
      return <Heading>{this.state.title}</Heading>;
    }

    return (
      <Heading>
        <img src={this.state.appIcon} className={styles.icon} />
        {this.state.title}
      </Heading>
    );
  }

  renderActions() {
    const { isInstalled, busyWith } = this.state;
    return (
      <>
        {!isInstalled && (
          <Button
            buttonType="primary"
            onClick={() => this.update(BUSY_STATE_INSTALLATION)}
            loading={busyWith === BUSY_STATE_INSTALLATION}
            className={styles.actionButton}
            disabled={!!busyWith}>
            Install
          </Button>
        )}
        {isInstalled && (
          <Button
            buttonType="muted"
            onClick={this.uninstall}
            loading={busyWith === BUSY_STATE_UNINSTALLATION}
            className={styles.actionButton}
            disabled={!!busyWith}>
            Uninstall
          </Button>
        )}
        {isInstalled && (
          <Button
            buttonType="primary"
            onClick={() => this.update(BUSY_STATE_UPDATE)}
            loading={busyWith === BUSY_STATE_UPDATE}
            className={styles.actionButton}
            disabled={!!busyWith}>
            Save
          </Button>
        )}
      </>
    );
  }

  renderContent() {
    return (
      <Workbench.Content type="full" className={styles.renderer}>
        <ExtensionIFrameRenderer
          bridge={this.props.bridge}
          descriptor={{ id: null, src: this.state.extensionDefinition.src }}
          parameters={this.parameters}
          isFullSize
        />
      </Workbench.Content>
    );
  }

  renderLoading() {
    return (
      <Workbench>
        <Workbench.Header title="" onBack={this.props.goBackToList} />
        <Workbench.Content type="text">
          <SkeletonContainer ariaLabel="Loading app..." svgWidth="100%" svgHeight="300px">
            <SkeletonBodyText numberOfLines={5} marginBottom={15} offsetTop={60} />
          </SkeletonContainer>
        </Workbench.Content>
      </Workbench>
    );
  }

  onAuthorize = () => {
    this.setState({ acceptedPermissions: true });
  };

  render() {
    const { ready, isInstalled, acceptedPermissions, appIcon, title, appEnabled } = this.state;

    if (!ready) {
      return this.renderLoading();
    }

    if (!appEnabled && !isInstalled) {
      return this.renderAccessDenied();
    }

    if (!isInstalled && !acceptedPermissions) {
      return (
        <Workbench>
          <Workbench.Header title={this.renderTitle()} onBack={this.props.goBackToList} />
          <Workbench.Content type="text">
            <AppPermissions
              onAuthorize={this.onAuthorize}
              onCancel={this.props.goBackToList}
              icon={appIcon}
              appName={title}
              centered
            />
          </Workbench.Content>
        </Workbench>
      );
    }

    return (
      <AdminOnly>
        <DocumentTitle title={this.state.title} />
        {this.renderBusyOverlay()}
        <Workbench>
          <Workbench.Header
            onBack={() => {
              this.props.goBackToList();
            }}
            title={this.renderTitle()}
            actions={this.renderActions()}
          />
          {this.renderContent()}
        </Workbench>
      </AdminOnly>
    );
  }
}
