import {
  Button,
  CopyButton,
  Dropdown,
  DropdownList,
  DropdownListItem,
  Flex,
  Heading,
  Icon,
  ModalLauncher,
  Notification,
  Paragraph,
  Tab,
  TabPanel,
  Tabs,
  Workbench,
  Tag,
} from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import DocumentTitle from 'components/shared/DocumentTitle';
import deepEqual from 'fast-deep-equal';
import React from 'react';
import { validate as validateDefinition, ValidationError, AppEditor } from '../AppEditor';
import { AppInstallModal } from '../AppInstallModal';
import { DeleteAppDialog } from '../DeleteAppDialog';
import { AppEvents, validate as validateEvents } from '../events';
import { KeyListing } from '../keys/KeyListing';
import { ManagementApiClient } from '../ManagementApiClient';
import { SaveConfirmModal } from '../SaveConfirmModal';
import { SigningSecret } from '../SigningSecret';
import { AppBundles } from '../AppBundle';
import { TAB_PATHS } from './constants';
import { InvalidChangesDialog } from './InvalidChangesDialog';
import { styles } from './styles';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { AppDefinitionWithBundle } from '../AppEditor/AppHosting';
import { AppBundleData } from '../AppEditor';
import { HostingStateContext } from './HostingStateProvider';
import { evictCustomAppDefinition } from 'widgets/CustomWidgetLoaderInstance';
import { FLAGS, getVariation } from 'LaunchDarkly';

const ERROR_PATH_DEFINITION = ['definition'];
const ERROR_PATH_EVENTS = ['events'];

function formatDate(date: string) {
  return new Date(date).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const userNameCache = {};

interface Event {
  enabled: boolean;
  targetUrl: string;
  topics: unknown[];
}

interface Props {
  definition: AppDefinitionWithBundle;
  bundles: { items: AppBundleData[] };
  events: Event;
  goToListView: () => void;
  goToTab: (tab: string) => void;
  tab: string;

  setDirty: (dirty: boolean) => void;
  setRequestLeaveConfirmation: (fn: () => void) => void;
}

interface State {
  dirty: boolean;
  busy: boolean;
  name: string;
  savedDefinition: AppDefinitionWithBundle;
  definition: AppDefinitionWithBundle;
  savedEvents: Event;
  events: Event;
  selectedTab: string;
  creator: string;
  errors: ValidationError[];
  actionsDropdownOpen: boolean;
  hostingEnabled: boolean;
}

export class AppDetails extends React.Component<Props, State> {
  static contextType = HostingStateContext;
  constructor(props: Props) {
    super(props);

    this.state = {
      dirty: false,
      busy: false,
      name: props.definition.name,
      savedDefinition: props.definition,
      definition: props.definition,
      savedEvents: props.events,
      events: props.events,
      selectedTab: props.tab,
      creator: userNameCache[props.definition.sys.id] || '',
      errors: [],
      actionsDropdownOpen: false,
      hostingEnabled: false,
    };

    this.props.setRequestLeaveConfirmation(this.openUnsavecChangesDialog);
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

    if (definition.bundle) {
      // If a customer already has bundle enabled, we show them the UI
      this.setState({ hostingEnabled: true });
    } else {
      getVariation(FLAGS.APP_HOSTING_UI, {
        organizationId: definition.sys.organization.sys.id,
      }).then((hostingEnabled) => this.setState({ hostingEnabled }));
    }
  }

  validate = () => {
    const errors = [
      ...validateDefinition(this.state.definition, ERROR_PATH_DEFINITION),
      ...validateEvents(this.state.events, ERROR_PATH_EVENTS),
    ];
    this.setState({ errors });
    return errors;
  };

  /**
   * Only gets called when dirty = true
   */
  openUnsavecChangesDialog = async () => {
    const errors = this.validate();

    if (errors.length > 0) {
      return await ModalLauncher.open(({ isShown, onClose }) => (
        <InvalidChangesDialog isShown={isShown} onClose={onClose} />
      ));
    }

    return await ModalLauncher.open(({ isShown, onClose }) => (
      <UnsavedChangesDialog save={this.save} isShown={isShown} onClose={onClose} />
    ));
  };

  openSaveConfirmModal = async () => {
    const errors = this.validate();
    if (errors.length > 0) {
      return;
    }

    await ModalLauncher.open(({ isShown, onClose }) => (
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

  save = async () => {
    this.setState({ busy: true });

    const [definitionResult, eventsResult] = await Promise.allSettled([
      this.saveDefinition(),
      this.saveEvents(),
    ]);

    let savedDefinition = this.state.savedDefinition;
    let savedEvents = this.state.savedEvents;

    const errors: ValidationError[] = [];
    if (definitionResult.status === 'fulfilled') {
      savedDefinition = definitionResult.value;
      this.setState({ savedDefinition });
      this.updateFormState({ definition: savedDefinition, events: savedEvents });
      evictCustomAppDefinition(savedDefinition.sys.id);
    } else {
      if (definitionResult.reason.status === 422) {
        errors.push(...definitionResult.reason.data.details.errors);
      }
    }

    if (eventsResult.status === 'fulfilled') {
      savedEvents = eventsResult.value;
      this.setState({ savedEvents });
      this.updateFormState({ definition: savedDefinition, events: savedEvents });
    } else {
      if (eventsResult.reason.status === 422) {
        errors.push(...eventsResult.reason.data.details.errors);
      }
    }

    if (errors.length > 0) {
      this.setState({ errors });
    }

    if (definitionResult.status === 'fulfilled' && eventsResult.status === 'fulfilled') {
      Notification.success('App definition and events saved successfully.');
    } else if (definitionResult.status === 'fulfilled' && eventsResult.status === 'rejected') {
      Notification.success('App definition saved successfully.');
      Notification.error(
        errors.length > 0
          ? ManagementApiClient.VALIDATION_MESSAGE
          : "Something went wrong. Couldn't save app events."
      );
    } else if (definitionResult.status === 'rejected' && eventsResult.status === 'fulfilled') {
      Notification.error(
        errors.length > 0
          ? ManagementApiClient.VALIDATION_MESSAGE
          : "Something went wrong. Couldn't save app definition."
      );
      Notification.success('App events saved successfully.');
    } else {
      Notification.error(
        errors.length > 0
          ? ManagementApiClient.VALIDATION_MESSAGE
          : "Something went wrong. Couldn't save app definition and events."
      );
    }

    this.setState({ busy: false });
  };

  saveDefinition = async () => {
    try {
      return await ManagementApiClient.save({
        ...this.state.definition,
        // save only what has been selected as switch option
        bundle: this.context.isAppHosting ? this.state.definition.bundle : undefined,
        src: !this.context.isAppHosting ? this.state.definition.src : undefined,
      });
    } catch (err) {
      if (err.status === 422) {
        err.data.details.errors.forEeach((error: ValidationError) => {
          if (error.path[0] === 'locations' && typeof error.path[1] === 'number') {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            error.path[1] = this.state.definition.locations![error.path[1]].location;
          }

          error.path = [...ERROR_PATH_DEFINITION, ...error.path];
        });
      }

      throw err;
    }
  };

  saveEvents = async () => {
    try {
      if (this.state.events.enabled) {
        const { targetUrl, topics } = await ManagementApiClient.updateAppEvents(
          this.props.definition.sys.organization.sys.id,
          this.props.definition.sys.id,
          {
            targetUrl: this.state.events.targetUrl,
            topics: this.state.events.topics,
          }
        );
        return { enabled: true, targetUrl, topics };
      } else {
        if (this.state.savedEvents.enabled) {
          await ManagementApiClient.deleteAppEvents(
            this.props.definition.sys.organization.sys.id,
            this.props.definition.sys.id
          );
        }
        return { enabled: false, targetUrl: '', topics: [] };
      }
    } catch (err) {
      if (err.status === 422) {
        return err.data.details.errors.forEeach((error: ValidationError) => {
          error.path = [...ERROR_PATH_EVENTS, ...error.path];
        });
      }

      throw err;
    }
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
        onConfirm={async () => {
          await this.delete();
          onClose();
        }}
        appName={this.state.name}
      />
    ));
  };

  onTabSelect = (tab: string) => {
    this.setState({ selectedTab: tab });
    this.props.goToTab(tab);
  };

  updateFormState = ({ events, definition }) => {
    const dirty =
      !deepEqual(this.state.savedDefinition, definition) ||
      !deepEqual(this.state.savedEvents, events);

    this.setState({ events, definition, dirty });
    this.props.setDirty(dirty);
  };

  resetDefinitionBundle = () => {
    const originalBundle = this.state.savedDefinition.bundle;
    const definition = { ...this.state.definition, bundle: originalBundle };
    this.setState({ definition });
  };

  render() {
    const { name, definition, events, savedEvents, errors, busy, selectedTab, dirty } = this.state;

    return (
      <Workbench>
        <DocumentTitle title="Apps" />
        <Workbench.Header
          title="App details"
          actions={
            <div className="workbench-header__actions">
              <Dropdown
                isOpen={this.state.actionsDropdownOpen}
                onClose={() => this.setState({ actionsDropdownOpen: false })}
                toggleElement={
                  <Button
                    buttonType="muted"
                    indicateDropdown
                    onClick={() =>
                      this.setState({ actionsDropdownOpen: !this.state.actionsDropdownOpen })
                    }>
                    Actions
                  </Button>
                }>
                <DropdownList>
                  <DropdownListItem
                    onClick={() => {
                      this.setState({ actionsDropdownOpen: false });
                      this.openInstallModal();
                    }}>
                    Install to space
                  </DropdownListItem>
                  <DropdownListItem
                    onClick={() => {
                      this.setState({ actionsDropdownOpen: false });
                      this.openDeleteModal();
                    }}
                    testId="app-delete"
                    isDisabled={busy}>
                    Delete {name}
                  </DropdownListItem>
                </DropdownList>
              </Dropdown>
              <Button
                loading={busy}
                buttonType="positive"
                disabled={busy || !dirty}
                onClick={this.openSaveConfirmModal}
                testId="app-save">
                Save
              </Button>
            </div>
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
              <Paragraph>
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
                <Flex alignItems="center">
                  General
                  {errors.find((error) => error.path[0] === 'definition') && (
                    <Icon
                      color="negative"
                      icon="InfoCircle"
                      className={styles.validationErrorIcon}
                    />
                  )}
                </Flex>
              </Tab>
              {this.state.hostingEnabled ? (
                <Tab
                  id={TAB_PATHS.HOSTING}
                  selected={selectedTab === TAB_PATHS.HOSTING}
                  onSelect={this.onTabSelect}>
                  Hosting{' '}
                  <Tag className={styles.hostingTag} tagType="primary-filled" size="small">
                    New
                  </Tag>
                </Tab>
              ) : null}
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
                <Flex alignItems="center">
                  Events
                  {errors.find((error) => error.path[0] === 'events') && (
                    <Icon
                      color="negative"
                      icon="InfoCircle"
                      className={styles.validationErrorIcon}
                    />
                  )}
                </Flex>
              </Tab>
            </Tabs>
            {selectedTab === TAB_PATHS.GENERAL && (
              <TabPanel id={TAB_PATHS.GENERAL} className={styles.tabPanel}>
                <AppEditor
                  definition={definition}
                  onChange={(definition) => this.updateFormState({ events, definition })}
                  errorPath={ERROR_PATH_DEFINITION}
                  errors={errors}
                  onErrorsChange={(errors) => this.setState({ errors })}
                  disabled={busy}
                />
              </TabPanel>
            )}
            {this.state.hostingEnabled
              ? selectedTab === TAB_PATHS.HOSTING && (
                  <TabPanel id={TAB_PATHS.HOSTING} className={styles.tabPanel}>
                    <AppBundles
                      resetDefinitionBundle={this.resetDefinitionBundle}
                      definition={definition}
                      savedDefinition={this.state.savedDefinition}
                      onChange={(definition) => this.updateFormState({ events, definition })}
                    />
                  </TabPanel>
                )
              : null}
            {selectedTab === TAB_PATHS.SECURITY && (
              <TabPanel id={TAB_PATHS.SECURITY} className={styles.tabPanel}>
                <KeyListing definition={definition} />
                <SigningSecret definition={definition} />
              </TabPanel>
            )}
            {selectedTab === TAB_PATHS.EVENTS && (
              <TabPanel id={TAB_PATHS.EVENTS} className={styles.tabPanel}>
                <AppEvents
                  definition={definition}
                  events={events}
                  savedEvents={savedEvents}
                  onChange={(events) => this.updateFormState({ events, definition })}
                  errorPath={ERROR_PATH_EVENTS}
                  errors={errors}
                  onErrorsChange={(errors) => this.setState({ errors })}
                  disabled={busy}
                />
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
