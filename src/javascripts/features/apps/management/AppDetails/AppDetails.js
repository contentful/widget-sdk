import {
  Button,
  CopyButton,
  Heading,
  Notification,
  Paragraph,
  Tab,
  TabPanel,
  Tabs,
  TextLink,
  Workbench,
} from '@contentful/forma-36-react-components';
import { ModalLauncher, ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import DocumentTitle from 'components/shared/DocumentTitle';
import PropTypes from 'prop-types';
import React from 'react';
import { AppEditor, validate } from '../AppEditor';
import { AppInstallModal } from '../AppInstallModal';
import { DeleteAppDialog } from '../DeleteAppDialog';
import { AppEvents } from '../events';
import { KeyListing } from '../keys/KeyListing';
import { SigningSecret } from '../SigningSecret/';
import { ManagementApiClient } from '../ManagementApiClient';
import { SaveConfirmModal } from '../SaveConfirmModal';
import { TAB_PATHS } from './constants';
import { styles } from './styles';

function formatDate(date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const userNameCache = {};

export class AppDetails extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      busy: false,
      name: props.definition.name,
      definition: props.definition,
      selectedTab: props.tab,
      creator: userNameCache[props.definition.sys.id] || '',
      errors: [],
    };
  }

  async componentDidMount() {
    const { definition } = this.props;

    let creator = userNameCache[definition.sys.id];

    if (!creator) {
      creator = await ManagementApiClient.getCreatorNameOf(definition);
      userNameCache[definition.sys.id] = creator;
    }

    this.setState({ creator });

    if (!Object.values(TAB_PATHS).includes(this.props.tab)) {
      this.onTabSelect(TAB_PATHS.GENERAL);
    }
  }

  save = async () => {
    this.setState({ busy: true });

    try {
      const updated = await ManagementApiClient.save(this.state.definition);
      this.setState({ name: updated.name, definition: updated });
      Notification.success('App saved successfully.');
    } catch (err) {
      if (err.status === 422) {
        this.setState({
          errors: err.data.details.errors.map((error) => {
            if (error.path[0] === 'locations' && typeof error.path[1] === 'number') {
              error.path[1] = this.state.definition.locations[error.path[1]].location;
            }
            return error;
          }),
        });
        Notification.error(ManagementApiClient.VALIDATION_MESSAGE);
      } else {
        Notification.error("Something went wrong. Couldn't save app details.");
      }
    }

    this.setState({ busy: false });
  };

  delete = async () => {
    this.setState({ busy: true });

    try {
      await ManagementApiClient.deleteDef(this.state.definition);
      Notification.success(`${this.state.definition.name} was deleted!`);
      this.props.goToListView();
    } catch (err) {
      Notification.error('App failed to delete. Please try again');
      this.setState({ busy: false });
    }
  };

  openSaveConfirmModal = () => {
    const errors = validate(this.state.definition);
    this.setState({ errors });
    if (errors.length > 0) {
      return;
    }

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
      <DeleteAppDialog
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
    const { name, definition, busy, selectedTab } = this.state;

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
          onBack={this.props.goToListView}
        />
        <Workbench.Content>
          <div className={styles.workbenchContent}>
            <div className={styles.title}>
              <ProductIcon icon="Apps" size="xlarge" />
              <div>
                <Heading>{name}</Heading>
                <div className={styles.sysId}>
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
            <Tabs withDivider>
              <Tab
                id={TAB_PATHS.GENERAL}
                selected={selectedTab === TAB_PATHS.GENERAL}
                onSelect={this.onTabSelect}>
                General
              </Tab>
              <Tab
                id={TAB_PATHS.SECURITY}
                selected={selectedTab === TAB_PATHS.SECURITY}
                onSelect={this.onTabSelect}>
                Security
              </Tab>
              <Tab
                id={TAB_PATHS.EVENTS}
                selected={selectedTab === TAB_PATHS.EVENTS}
                onSelect={this.onTabSelect}>
                Events
              </Tab>
            </Tabs>
            {selectedTab === TAB_PATHS.GENERAL && (
              <TabPanel id={TAB_PATHS.GENERAL} className={styles.tabPanel}>
                <div>
                  <AppEditor
                    definition={definition}
                    onChange={(definition) => this.setState({ definition })}
                    errors={this.state.errors}
                    onErrorsChange={(errors) => this.setState({ errors })}
                  />
                </div>
                <div className={styles.formActions}>
                  <Button
                    loading={busy}
                    buttonType="positive"
                    disabled={busy}
                    onClick={this.openSaveConfirmModal}
                    testId="app-save">
                    Save
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
            {selectedTab === TAB_PATHS.SECURITY && (
              <TabPanel id={TAB_PATHS.SECURITY} className={styles.tabPanel}>
                <KeyListing definition={definition} />
                <SigningSecret definition={definition} />
              </TabPanel>
            )}
            {selectedTab === TAB_PATHS.EVENTS && (
              <TabPanel id={TAB_PATHS.EVENTS} className={styles.tabPanel}>
                <AppEvents definition={definition} />
              </TabPanel>
            )}
            {
              // old route that moved to /security
              selectedTab === TAB_PATHS.KEY_PAIRS && this.onTabSelect(TAB_PATHS.SECURITY)
            }
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
