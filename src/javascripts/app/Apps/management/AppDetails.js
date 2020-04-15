import React from 'react';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import {
  TextLink,
  Notification,
  Heading,
  Button,
  Paragraph,
  CopyButton,
  Workbench,
  Tabs,
  Tab,
  TabPanel,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import Icon from 'ui/Components/Icon';
import { getVariation } from 'LaunchDarkly';
import AppEditor from './AppEditor';
import * as ManagementApiClient from './ManagementApiClient';
import * as ModalLauncher from 'app/common/ModalLauncher';
import AppInstallModal from './AppInstallModal';
import DeleteAppModal from './DeleteAppDialog';
import SaveConfirmModal from './SaveConfirmModal';
import KeyListing from './keys/KeyListing';
import AppEvents from './events';
import { track } from 'analytics/Analytics';
import DocumentTitle from 'components/shared/DocumentTitle';
import { APP_MANAGEMENT_VIEWS } from 'featureFlags';

const TabPaths = {
  GENERAL: '',
  KEY_PAIRS: 'key-pairs',
  EVENTS: 'events',
};

const styles = {
  title: css({
    display: 'flex',
    alignItems: 'center',
    paddingBottom: tokens.spacingL,
    borderBottom: `1px solid ${tokens.colorElementLight}`,
    '& div:first-child': css({
      marginRight: tokens.spacingL,
    }),
    '& div:last-child h1': css({
      marginBottom: tokens.spacingXs,
    }),
  }),
  workbenchContent: css({
    maxWidth: '820px',
    margin: 'auto',
  }),
  copyButton: css({
    button: css({
      height: '20px',
      border: 'none',
      backgroundColor: 'transparent',
      transform: 'translateX(-10px)',
      opacity: '0',
      transition: `all ${tokens.transitionDurationDefault} ${tokens.transitionEasingCubicBezier}`,
      '&:hover': css({
        backgroundColor: 'transparent',
        border: 'none',
        opacity: '1',
        transform: 'translateX(0)',
      }),
    }),
  }),
  info: css({
    padding: `${tokens.spacingL} 0`,
    '& p:first-child': css({
      marginBottom: tokens.spacing2Xs,
    }),
    '& p b': css({
      color: tokens.colorTextMid,
      marginRight: tokens.spacing2Xs,
    }),
  }),
  tabPanel: css({
    padding: `${tokens.spacingL} 0`,
    marginBottom: tokens.spacing4Xl,
  }),
  formActions: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacingL,
  }),
  creatorMissing: css({
    opacity: 0,
  }),
  creator: css({
    transition: 'opacity .2s ease',
  }),
};

const sysIdStyle = css({
  display: 'flex',
  flexDirection: 'row',
  '& p': css({
    fontFamily: tokens.fontStackMonospace,
    fontSize: tokens.fontSizeS,
    color: tokens.colorTextMid,
  }),
  [`&:hover .${styles.copyButton} button`]: css({
    opacity: '1',
    transform: 'translateX(0)',
  }),
});

function formatDate(date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const userNameCache = {};

export default class AppDetails extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      busy: false,
      appManagementViewsEnabled: false,
      name: props.definition.name,
      definition: props.definition,
      selectedTab: props.tab,
      creator: userNameCache[props.definition.sys.id] || '',
    };
  }

  async componentDidMount() {
    const { definition } = this.props;

    let creator = userNameCache[definition.sys.id];

    const appManagementViewsEnabled = await getVariation(APP_MANAGEMENT_VIEWS, {
      organizationId: definition.sys.organization.sys.id,
    });

    if (!creator) {
      creator = await ManagementApiClient.getCreatorNameOf(definition);
      userNameCache[definition.sys.id] = creator;
    }

    this.setState({ creator, appManagementViewsEnabled });
  }

  save = async () => {
    this.setState({ busy: true });

    try {
      const updated = await ManagementApiClient.save(this.state.definition);
      this.setState({ name: updated.name, definition: updated });
      Notification.success('App updated successfully.');
      track('app_management:updated', {
        definitionId: updated.sys.id,
      });
    } catch (err) {
      Notification.error(
        'Validation failed. Please check that you have provided an app Name, valid Source URL and/or Entry field types.'
      );
    }

    this.setState({ busy: false });
  };

  delete = async () => {
    this.setState({ busy: true });

    try {
      await ManagementApiClient.deleteDef(this.state.definition);
      Notification.success(`${this.state.definition.name} was deleted!`);
      track('app_management:deleted', {
        definitionId: this.state.definition.sys.id,
      });
      this.props.goToListView();
    } catch (err) {
      Notification.error('App failed to delete. Please try again');
      this.setState({ busy: false });
    }
  };

  openSaveConfirmModal = () => {
    ModalLauncher.open(({ isShown, onClose }) => (
      <SaveConfirmModal
        isShown={isShown}
        name={this.state.definition.name}
        onConfirm={() => {
          this.save();
          onClose();
        }}
        onClose={onClose}
      />
    ));
  };

  openInstallModal = () => {
    ModalLauncher.open(({ isShown, onClose }) => (
      <AppInstallModal definition={this.state.definition} isShown={isShown} onClose={onClose} />
    ));
  };

  openDeleteModal = () => {
    ModalLauncher.open(({ isShown, onClose }) => (
      <DeleteAppModal
        isShown={isShown}
        onCancel={onClose}
        onConfirm={() => {
          this.delete();
          onClose();
        }}
        appName={this.state.name}
      />
    ));
  };

  onTabSelect = (tab) => {
    this.setState({ selectedTab: tab });
    this.props.goToTab(tab);
  };

  render() {
    const { name, definition, busy, selectedTab, appManagementViewsEnabled } = this.state;

    return (
      <Workbench>
        <DocumentTitle title="Apps" />
        <Workbench.Header
          title="App details"
          actions={
            <Button disabled={busy} onClick={this.openInstallModal} testId="app-install">
              Install to space
            </Button>
          }
          onBack={this.props.goToListView}></Workbench.Header>
        <Workbench.Content>
          <div className={styles.workbenchContent}>
            <div className={styles.title}>
              <div>
                <Icon name="page-apps" scale="1.6" />
              </div>
              <div>
                <Heading>{name}</Heading>
                <div className={sysIdStyle}>
                  <Paragraph>{definition.sys.id}</Paragraph>
                  <CopyButton className={styles.copyButton} copyValue={definition.sys.id} />
                </div>
              </div>
            </div>
            <div className={styles.info}>
              <Paragraph title={new Date(definition.sys.createdAt)}>
                <b>Created</b> {formatDate(definition.sys.createdAt)}
              </Paragraph>
              <Paragraph>
                <b>Created by</b>{' '}
                <span className={this.state.creator ? styles.creator : styles.creatorMissing}>
                  {this.state.creator}
                </span>
              </Paragraph>
            </div>
            <Tabs>
              <Tab
                id={TabPaths.GENERAL}
                selected={selectedTab === TabPaths.GENERAL}
                onSelect={this.onTabSelect}>
                General
              </Tab>
              {appManagementViewsEnabled ? (
                <>
                  <Tab
                    id={TabPaths.KEY_PAIRS}
                    selected={selectedTab === TabPaths.KEY_PAIRS}
                    onSelect={this.onTabSelect}>
                    Key pairs
                  </Tab>
                  <Tab
                    id={TabPaths.EVENTS}
                    selected={selectedTab === TabPaths.EVENTS}
                    onSelect={this.onTabSelect}>
                    Events
                  </Tab>
                </>
              ) : null}
            </Tabs>
            {selectedTab === TabPaths.GENERAL && (
              <TabPanel id={TabPaths.GENERAL} className={styles.tabPanel}>
                <div>
                  <AppEditor
                    definition={definition}
                    onChange={(definition) => this.setState({ definition })}
                  />
                </div>
                <div className={styles.formActions}>
                  <Button
                    loading={busy}
                    disabled={busy}
                    onClick={this.openSaveConfirmModal}
                    testId="app-save">
                    Update app
                  </Button>
                  <TextLink
                    linkType="negative"
                    disabled={busy}
                    onClick={this.openDeleteModal}
                    testId="app-delete">
                    Delete {name}
                  </TextLink>
                </div>
              </TabPanel>
            )}
            {selectedTab === TabPaths.KEY_PAIRS && (
              <TabPanel id={TabPaths.KEY_PAIRS} className={styles.tabPanel}>
                <KeyListing definition={definition} />
              </TabPanel>
            )}
            {selectedTab === TabPaths.EVENTS && (
              <TabPanel id={TabPaths.EVENTS} className={styles.tabPanel}>
                <AppEvents definition={definition} />
              </TabPanel>
            )}
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}

AppDetails.propTypes = {
  definition: PropTypes.object.isRequired,
  goToListView: PropTypes.func.isRequired,
  goToTab: PropTypes.func.isRequired,
  tab: PropTypes.string.isRequired,
};
