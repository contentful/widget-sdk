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
import { headerActions } from '../styles';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { AppDefinitionWithBundle } from '../AppEditor/AppHosting';
import { evictCustomAppDefinition } from 'widgets/CustomWidgetLoaderInstance';
import { FLAGS, getVariation } from 'core/feature-flags';
import {
  AppDetailsStateContext,
  ERROR_PATH_DEFINITION,
  ERROR_PATH_EVENTS,
} from './AppDetailsStateContext';
import { UnsavedChangesBlocker } from 'app/common/UnsavedChangesDialog';

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
  events: Event;
  goToListView: () => void;
  goToTab: (tab: string) => void;
  tab: string;
  setDirty: (dirty: boolean) => void;
  setRequestLeaveConfirmation: (fn: () => Promise<void>) => void;
}

export const AppDetails = (props: Props) => {
  const [dirty, setDirty] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [name, setName] = React.useState(props.definition.name);
  const [selectedTab, setSelectedTab] = React.useState(props.tab);
  const [creator, setCreator] = React.useState(userNameCache[props.definition.sys.id] || '');
  const [errors, setErrors] = React.useState<ValidationError[]>([]);
  const [actionsDropdownOpen, setActionsDropdownOpen] = React.useState(false);
  const [hostingEnabled, setHostingEnabled] = React.useState(false);
  const [savedEvents, setSavedEvents] = React.useState(props.events);

  const {
    draftDefinition,
    setDraftDefinition,
    draftEvents,
    setDraftEvents,
    saveDefinition,
    saveEvents,
    setSavedDefinition,
    savedDefinition,
  } = React.useContext(AppDetailsStateContext);

  React.useEffect(() => {
    props.setRequestLeaveConfirmation(openUnsavecChangesDialog);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const setCreatorCall = async () => {
      let creator = userNameCache[props.definition.sys.id];

      if (!creator) {
        creator = await ManagementApiClient.getCreatorNameOf(props.definition);
        userNameCache[props.definition.sys.id] = creator;
      }

      setCreator(creator);
    };

    setCreatorCall();
  }, [props.definition]);

  const { goToTab, tab } = props;

  const onTabSelect = React.useCallback(
    (tab: string) => {
      setSelectedTab(tab);
      goToTab(tab);
    },
    [goToTab]
  );

  React.useEffect(() => {
    if (!Object.values(TAB_PATHS).includes(tab)) {
      onTabSelect(TAB_PATHS.GENERAL);
    }
  }, [onTabSelect, tab]);

  React.useEffect(() => {
    if (props.definition.bundle) {
      // If a customer already has bundle enabled, we show them the UI
      setHostingEnabled(true);
    } else {
      getVariation(FLAGS.APP_HOSTING_UI, {
        organizationId: props.definition.sys.organization.sys.id,
      }).then(setHostingEnabled);
    }
  }, [props.definition]);

  const validate = () => {
    const errors = [
      ...validateDefinition(draftDefinition, ERROR_PATH_DEFINITION),
      ...validateEvents(draftEvents, ERROR_PATH_EVENTS),
    ];
    setErrors(errors);
    return errors;
  };

  /**
   * Only gets called when dirty = true
   */
  const openUnsavecChangesDialog = async () => {
    const errors = validate();

    if (errors.length > 0) {
      return await ModalLauncher.open(({ isShown, onClose }) => (
        <InvalidChangesDialog isShown={isShown} onClose={onClose} />
      ));
    }

    return await ModalLauncher.open(({ isShown, onClose }) => (
      <UnsavedChangesDialog save={save} isShown={isShown} onClose={onClose} />
    ));
  };

  const openSaveConfirmModal = async () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      return;
    }

    await ModalLauncher.open(({ isShown, onClose }) => (
      <SaveConfirmModal
        isShown={isShown}
        name={draftDefinition.name}
        onConfirm={() => {
          save();
          onClose();
        }}
        onClose={onClose}
      />
    ));
  };

  const save = async () => {
    setBusy(true);

    const [definitionResult, eventsResult] = await Promise.allSettled([
      saveDefinition(),
      saveEvents(),
    ]);

    let savedDefinitionDraft = savedDefinition;
    let savedEventsDraft = savedEvents;

    const validationErrors: ValidationError[] = [];
    if (definitionResult.status === 'fulfilled') {
      savedDefinitionDraft = definitionResult.value;
      setSavedDefinition(savedDefinitionDraft);
      setName(definitionResult.value.name);
      evictCustomAppDefinition(savedDefinition.sys.id);
    } else {
      if (definitionResult.reason.status === 422) {
        validationErrors.push(...definitionResult.reason.data.details.errors);
      }
    }

    if (eventsResult.status === 'fulfilled') {
      savedEventsDraft = eventsResult.value;
      setSavedEvents(savedEventsDraft);
      setDraftDefinition(savedDefinitionDraft);
      setDraftEvents(savedEventsDraft);
    } else {
      if (eventsResult.reason.status === 422) {
        validationErrors.push(...eventsResult.reason.data.details.errors);
      }
    }

    if (errors.length > 0) {
      setErrors(validationErrors);
    }

    if (definitionResult.status === 'fulfilled' && eventsResult.status === 'fulfilled') {
      Notification.success('App definition and events saved successfully.');
    } else if (definitionResult.status === 'fulfilled' && eventsResult.status === 'rejected') {
      Notification.success('App definition saved successfully.');
      Notification.error(
        validationErrors.length > 0
          ? ManagementApiClient.VALIDATION_MESSAGE
          : "Something went wrong. Couldn't save app events."
      );
    } else if (definitionResult.status === 'rejected' && eventsResult.status === 'fulfilled') {
      Notification.error(
        validationErrors.length > 0
          ? ManagementApiClient.VALIDATION_MESSAGE
          : "Something went wrong. Couldn't save app definition."
      );
      Notification.success('App events saved successfully.');
    } else {
      Notification.error(
        validationErrors.length > 0
          ? ManagementApiClient.VALIDATION_MESSAGE
          : "Something went wrong. Couldn't save app definition and events."
      );
    }

    setBusy(false);
  };

  const deleteDef = async () => {
    setBusy(true);

    try {
      await ManagementApiClient.deleteDef(props.definition);
      Notification.success(`${props.definition.name} was deleted!`);
      props.goToListView();
    } catch (err) {
      Notification.error('App failed to delete. Please try again');
      setBusy(false);
    }
  };

  const openInstallModal = () => {
    ModalLauncher.open(({ isShown, onClose }) => (
      <AppInstallModal definition={draftDefinition} isShown={isShown} onClose={onClose} />
    ));
  };

  const openDeleteModal = () => {
    ModalLauncher.open(({ isShown, onClose }) => (
      <DeleteAppDialog
        isShown={isShown}
        onCancel={onClose}
        onConfirm={async () => {
          await deleteDef();
          onClose();
        }}
        appName={name}
      />
    ));
  };

  const { setDirty: onDirtyChange } = props;

  // check if form is dirty
  React.useEffect(() => {
    const newDirty =
      !deepEqual(savedDefinition, draftDefinition) || !deepEqual(savedEvents, draftEvents);
    setDirty(newDirty);
    onDirtyChange(newDirty);
  }, [savedDefinition, draftDefinition, savedEvents, draftEvents, onDirtyChange]);

  return (
    <Workbench>
      <DocumentTitle title="Apps" />
      {dirty ? <UnsavedChangesBlocker save={save} when /> : null}
      <Workbench.Header
        title="App details"
        actions={
          <Flex alignItems="center" alignSelf="center" className={headerActions}>
            <Dropdown
              isOpen={actionsDropdownOpen}
              onClose={() => setActionsDropdownOpen(false)}
              toggleElement={
                <Button
                  buttonType="muted"
                  indicateDropdown
                  onClick={() => setActionsDropdownOpen(!actionsDropdownOpen)}>
                  Actions
                </Button>
              }>
              <DropdownList>
                <DropdownListItem
                  onClick={() => {
                    setActionsDropdownOpen(false);
                    openInstallModal();
                  }}>
                  Install to space
                </DropdownListItem>
                <DropdownListItem
                  onClick={() => {
                    setActionsDropdownOpen(false);
                    openDeleteModal();
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
              onClick={openSaveConfirmModal}
              testId="app-save">
              Save
            </Button>
          </Flex>
        }
        onBack={props.goToListView}
      />
      <Workbench.Content>
        <div className={styles.workbenchContent}>
          <div className={styles.title}>
            <ProductIcon icon="Apps" size="xlarge" />
            <div>
              <Heading>{name}</Heading>
              <div className={styles.sysId}>
                <Paragraph>{draftDefinition.sys.id}</Paragraph>
                <CopyButton className={styles.copyButton} copyValue={draftDefinition.sys.id} />
              </div>
            </div>
          </div>
          <div className={styles.info}>
            <Paragraph>
              <b>Created</b> {formatDate(draftDefinition.sys.createdAt)}
            </Paragraph>
            <Paragraph>
              <b>Created by</b>{' '}
              <span className={creator ? styles.creator : styles.creatorMissing}>{creator}</span>
            </Paragraph>
          </div>
          <Tabs withDivider>
            <Tab
              id={TAB_PATHS.GENERAL}
              selected={selectedTab === TAB_PATHS.GENERAL}
              onSelect={onTabSelect}>
              <Flex alignItems="center">
                General
                {errors.find((error) => error.path[0] === 'definition') && (
                  <Icon color="negative" icon="InfoCircle" className={styles.validationErrorIcon} />
                )}
              </Flex>
            </Tab>
            {hostingEnabled ? (
              <Tab
                id={TAB_PATHS.BUNDLES}
                selected={selectedTab === TAB_PATHS.BUNDLES}
                onSelect={onTabSelect}>
                Bundles{' '}
                <Tag className={styles.hostingTag} tagType="primary-filled" size="small">
                  New
                </Tag>
              </Tab>
            ) : null}
            <Tab
              id={TAB_PATHS.SECURITY}
              selected={selectedTab === TAB_PATHS.SECURITY}
              onSelect={onTabSelect}>
              Security
            </Tab>
            <Tab
              id={TAB_PATHS.EVENTS}
              selected={selectedTab === TAB_PATHS.EVENTS}
              onSelect={onTabSelect}>
              <Flex alignItems="center">
                Events
                {errors.find((error) => error.path[0] === 'events') && (
                  <Icon color="negative" icon="InfoCircle" className={styles.validationErrorIcon} />
                )}
              </Flex>
            </Tab>
          </Tabs>
          {selectedTab === TAB_PATHS.GENERAL && (
            <TabPanel id={TAB_PATHS.GENERAL} className={styles.tabPanel}>
              <AppEditor
                goToTab={onTabSelect}
                errorPath={ERROR_PATH_DEFINITION}
                errors={errors}
                onErrorsChange={setErrors}
                disabled={busy}
              />
            </TabPanel>
          )}
          {hostingEnabled
            ? selectedTab === TAB_PATHS.BUNDLES && (
                <TabPanel id={TAB_PATHS.BUNDLES} className={styles.tabPanel}>
                  <AppBundles />
                </TabPanel>
              )
            : null}
          {selectedTab === TAB_PATHS.SECURITY && (
            <TabPanel id={TAB_PATHS.SECURITY} className={styles.tabPanel}>
              <KeyListing definition={draftDefinition} />
              <SigningSecret definition={draftDefinition} />
            </TabPanel>
          )}
          {selectedTab === TAB_PATHS.EVENTS && (
            <TabPanel id={TAB_PATHS.EVENTS} className={styles.tabPanel}>
              <AppEvents
                savedEvents={savedEvents}
                errorPath={ERROR_PATH_EVENTS}
                errors={errors}
                onErrorsChange={setErrors}
                disabled={busy}
              />
            </TabPanel>
          )}
          {
            // old route that moved to /security
            selectedTab === TAB_PATHS.KEY_PAIRS && onTabSelect(TAB_PATHS.SECURITY)
          }
        </div>
      </Workbench.Content>
    </Workbench>
  );
};
