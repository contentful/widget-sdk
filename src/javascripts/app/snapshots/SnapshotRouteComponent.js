import React, { Fragment, useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { set, get, extend, filter } from 'lodash';
import { css } from 'emotion';
import {
  Workbench,
  Button,
  TextLink,
  CheckboxField,
  FieldGroup,
  Notification,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import * as Permissions from 'access_control/EntityPermissions';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import * as trackVersioning from 'analytics/events/versioning';
import * as Entries from 'data/entries';
import SnapshotSelector from './SnapshotSelector';
import SnapshotPresenter from './SnapshotPresenter';
import SnapshotWidgetCell from './SnapshotWidgetCell';
import useSelectedVersions from './useSelectedVersions';
import useEnrichedWidgets from './useEnrichedWidgets';
import { CURRENT, SNAPSHOT } from './utils';
import { useUnsavedChangesModal } from 'core/hooks';
import { loadEntry as loadEditorData } from 'app/entity_editor/DataLoader';
import { go } from 'states/Navigator';
import { router } from 'core/react-routing';
import { LoadingState } from 'features/loading-state';
import { getSpaceContext } from 'classes/spaceContext';

const styles = {
  workbenchContent: css({
    padding: 0,
  }),
  actionButton: css({
    marginLeft: tokens.spacingM,
  }),
  header: css({
    display: 'flex',
    backgroundColor: tokens.colorElementLightest,
  }),
  headerCell: css({
    maxWidth: '50%',
    display: 'flex',
    flex: '1 0',
    '&:first-child': {
      borderRight: '1px solid #dbdbdb',
    },
    padding: `${tokens.spacingL} ${tokens.spacing3Xl}`,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${tokens.colorElementDarkest}`,
    '& > label': {
      display: 'flex',
      alignItems: 'center',
      '& > input': {
        margin: `0 ${tokens.spacingXs} 2px`,
      },
    },
  }),
  version: css({
    color: tokens.colorTextDark,
    fontSize: tokens.fontSizeL,
    fontWeight: tokens.fontWeightDemiBold,
    paddingRight: tokens.spacing2Xs,
  }),
  fieldLocale: css({
    display: 'flex',
  }),
  loader: css({
    height: '100%',
    '> div': {
      height: '100%',
    },
  }),
};

const handleSaveError = (error) => {
  if (error.code === 'VersionMismatch') {
    Notification.error('Versions do not match. Please reload the version first.');
  } else {
    Notification.error('Changes could not be reverted. Please try again.');
  }
};

const SnapshotComparator = (props) => {
  const [editorData, setEditorData] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const { registerSaveAction, setDirty } = useUnsavedChangesModal();
  const getEditorData = useCallback(() => editorData, [editorData]);
  const widgets = useMemo(() => {
    if (!editorData) {
      return [];
    }

    return filter(editorData.fieldControls.form, (widget) => !get(widget, 'field.disabled'));
  }, [editorData]);
  const [{ enrichedWidgets, diffCount }] = useEnrichedWidgets({
    widgets,
    getEditorData,
    snapshot,
  });
  const [
    { selectedVersions, pathsToRestore },
    { setSelectedVersionForField, setSelectAllSnapshots },
  ] = useSelectedVersions({ enrichedWidgets });

  const entry = get(editorData, 'entity', {});
  const entryData = get(entry, ['data'], {});
  const permissions = Permissions.create(entryData);

  const title = editorData ? EntityFieldValueSpaceContext.entryTitle(entry) : '';

  const onSave = useCallback(
    async (redirect) => {
      function prepareRestoredEntry() {
        const ctData = get(editorData, 'contentType', {});
        const restoredSnapshot = Entries.internalToExternal(snapshot.snapshot || {}, ctData);
        const restoredResult = Entries.internalToExternal(entry.data, ctData);

        pathsToRestore.forEach((path) => {
          path = Entries.internalPathToExternal(ctData, path);
          set(restoredResult, path, get(restoredSnapshot, path));
        });

        return restoredResult;
      }

      async function onUpdateEntry(entry) {
        return getSpaceContext().cma.updateEntry(entry);
      }

      try {
        const restoredResult = prepareRestoredEntry();
        const entry = await onUpdateEntry(restoredResult);
        trackVersioning.registerRestoredVersion(entry);
        trackVersioning.restored(pathsToRestore, diffCount, showOnlyDifferences);
        setDirty(false);
        Notification.success('Entry successfully restored.');
        if (redirect) {
          stateRedirect(false);
        }
      } catch (error) {
        handleSaveError(error);
      }
    },
    [diffCount, editorData, entry.data, pathsToRestore, setDirty, showOnlyDifferences, snapshot]
  );

  const pathsToRestoreExist = pathsToRestore.length > 0;
  useEffect(() => {
    setDirty(pathsToRestoreExist);
  }, [pathsToRestoreExist, setDirty]);

  useEffect(() => {
    if (!props.entryId) {
      return;
    }
    loadEditorData(getSpaceContext(), props.entryId)
      .then(setEditorData)
      .catch(() => {
        Notification.error('Entry not found.');
        router.navigate({ path: 'entries.list' });
      });
  }, [props.entryId]);

  useEffect(() => {
    registerSaveAction(trackVersioning.trackableConfirmator(onSave), false);
  }, [registerSaveAction, onSave]);

  useEffect(() => {
    if (!editorData || !snapshot || !props.source) {
      return;
    }

    trackVersioning.setData(editorData.entity.data, snapshot);
    trackVersioning.opened(props.source);
  }, [editorData, snapshot, props.source]);

  useEffect(() => {
    if (!editorData || !props.snapshotId) {
      return;
    }

    async function init() {
      try {
        const { entity, contentType } = editorData;
        const snapshot = await getSpaceContext().cma.getEntrySnapshot(
          entity.getId(),
          props.snapshotId
        );

        setSnapshot(
          extend(snapshot, {
            snapshot: Entries.externalToInternal(snapshot.snapshot, contentType),
          })
        );
      } catch (err) {
        Notification.error('Entry version not found.');
        go({ path: '^.^' });
      }
    }

    init();
  }, [props.snapshotId, editorData]);

  const onClose = () => {
    if (!pathsToRestoreExist) {
      trackVersioning.closed();
    }
    return stateRedirect();
  };

  function goToSnapshot(snapshot) {
    setDirty(false);
    return go({ path: '.', params: { snapshotId: snapshot.sys.id, source: 'compareView' } });
  }

  function stateRedirect(reload) {
    if (reload) {
      return go({ path: '^.^', options: { reload: true } });
    }
    return go({ path: '^.^' });
  }

  const hasDiff = diffCount > 0;

  if (!editorData || !snapshot) {
    return (
      <div className={styles.loader}>
        <LoadingState />
      </div>
    );
  }

  return (
    <Workbench>
      <Workbench.Header
        title={title}
        onBack={onClose}
        icon={<ProductIcon icon="Content" size="large" />}
        actions={
          <Fragment>
            <Button
              testId="snapshots-comparator-button-save"
              type="button"
              buttonType="positive"
              disabled={!pathsToRestoreExist}
              onClick={() => onSave(true)}>
              Apply changes
            </Button>
            <Button
              type="button"
              buttonType="muted"
              onClick={onClose}
              className={styles.actionButton}>
              Close
            </Button>
          </Fragment>
        }
      />
      <Workbench.Content type="full" className={styles.workbenchContent}>
        <div className={styles.header}>
          <div className={styles.headerCell}>
            <SnapshotSelector
              snapshot={snapshot}
              editorData={editorData}
              goToSnapshot={goToSnapshot}
            />
            {hasDiff && (
              <TextLink
                testId="snapshots-comparator-button-restore-all"
                onClick={setSelectAllSnapshots}>
                Select all fields from this version
              </TextLink>
            )}
          </div>
          <div className={styles.headerCell}>
            <div className={styles.version}>Current version</div>
            {hasDiff && (
              <FieldGroup>
                <CheckboxField
                  id="show-only-differences"
                  labelText={`Show only differences (${diffCount})`}
                  checked={showOnlyDifferences}
                  onChange={() => setShowOnlyDifferences(!showOnlyDifferences)}
                />
              </FieldGroup>
            )}
          </div>
        </div>
        {enrichedWidgets.map(({ widget, hasMultipleLocales, locales }) => {
          const { field } = widget;

          return (
            <div data-field-api-name={field.apiName} key={field.id}>
              {locales.map(({ fieldPath, isDifferent, locale }) => {
                if (showOnlyDifferences && !isDifferent) {
                  return null;
                }

                const canEdit = permissions.canEditFieldLocale(field.apiName, locale.code);
                const isDisabled = field.disabled || !canEdit;
                const canRestore = isDifferent && !isDisabled;

                const onSelect = (version) => () => {
                  if (canRestore && isDifferent) {
                    setSelectedVersionForField(fieldPath, version);
                  }
                };

                let fieldName = field.name;
                if (hasMultipleLocales) {
                  fieldName = `${fieldName} - ${locale.name}`;
                }
                const selectedFieldVersion = selectedVersions[fieldPath] || CURRENT;
                return (
                  <div className={styles.fieldLocale} key={fieldPath}>
                    <SnapshotWidgetCell
                      version={SNAPSHOT}
                      isSelected={selectedFieldVersion === SNAPSHOT}
                      onSelect={onSelect(SNAPSHOT)}
                      canRestore={canRestore}
                      fieldName={fieldName}
                      isDisabled={isDisabled}>
                      <SnapshotPresenter
                        entity={get(snapshot, 'snapshot', {})}
                        editorData={editorData}
                        locale={locale}
                        widget={widget}
                      />
                    </SnapshotWidgetCell>
                    <SnapshotWidgetCell
                      version={CURRENT}
                      isSelected={selectedFieldVersion === CURRENT}
                      onSelect={onSelect(CURRENT)}
                      canRestore={canRestore}
                      fieldName={fieldName}
                      isDisabled={isDisabled}>
                      <SnapshotPresenter
                        entity={get(entry, 'data', {})}
                        editorData={editorData}
                        locale={locale}
                        widget={widget}
                      />
                    </SnapshotWidgetCell>
                  </div>
                );
              })}
            </div>
          );
        })}
      </Workbench.Content>
    </Workbench>
  );
};

SnapshotComparator.propTypes = {
  entryId: PropTypes.string.isRequired,
  snapshotId: PropTypes.string.isRequired,
  source: PropTypes.string.isRequired,
};

export default SnapshotComparator;
export { SnapshotComparator };
