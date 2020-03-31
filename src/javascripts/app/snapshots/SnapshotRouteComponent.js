import React, { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { set, get } from 'lodash';
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
import NavigationIcon from 'ui/Components/NavigationIcon';
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
};

const handleSaveError = (error) => {
  if (error.code === 'VersionMismatch') {
    Notification.error('Versions do not match. Please reload the version first.');
  } else {
    Notification.error('Changes could not be reverted. Please try again.');
  }
};

const SnapshotComparator = ({
  snapshot,
  widgets,
  getEditorData,
  setDirty,
  registerSaveAction,
  redirect: stateRedirect,
  onUpdateEntry,
  ...props
}) => {
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const [{ enrichedWidgets, diffCount }] = useEnrichedWidgets({ widgets, getEditorData, snapshot });
  const [
    { selectedVersions, pathsToRestore },
    { setSelectedVersionForField, setSelectAllSnapshots },
  ] = useSelectedVersions({ enrichedWidgets });

  const pathsToRestoreExist = pathsToRestore.length > 0;
  useEffect(() => {
    setDirty(pathsToRestoreExist);
  }, [pathsToRestoreExist, setDirty]);

  const editorData = getEditorData();
  const entry = get(editorData, 'entity', {});
  const dataSys = get(entry, ['data', 'sys'], {});
  const permissions = Permissions.create(dataSys);

  const title = EntityFieldValueSpaceContext.entryTitle(entry);

  const goToSnapshot = ({ sys }) => {
    setDirty(false);
    props.goToSnapshot(sys.id);
  };

  const onClose = () => {
    if (!pathsToRestoreExist) {
      trackVersioning.closed();
    }
    return stateRedirect();
  };

  const prepareRestoredEntry = () => {
    const ctData = get(editorData, 'contentType.data', {});
    const restoredSnapshot = Entries.internalToExternal(snapshot.snapshot || {}, ctData);
    const restoredResult = Entries.internalToExternal(entry.data, ctData);

    pathsToRestore.forEach((path) => {
      path = Entries.internalPathToExternal(ctData, path);
      set(restoredResult, path, get(restoredSnapshot, path));
    });

    return restoredResult;
  };

  const onSave = async (redirect) => {
    try {
      const restoredResult = prepareRestoredEntry();
      const entry = await onUpdateEntry(restoredResult);
      trackVersioning.registerRestoredVersion(entry);
      trackVersioning.restored(pathsToRestore, diffCount, showOnlyDifferences);
      setDirty(false);
      Notification.success('Entry successfully restored.');
      if (redirect) stateRedirect(true);
    } catch (error) {
      handleSaveError(error);
    }
  };

  registerSaveAction(trackVersioning.trackableConfirmator(onSave));

  const hasDiff = diffCount > 0;
  return (
    <Workbench>
      <Workbench.Header
        title={title}
        onBack={onClose}
        icon={<NavigationIcon icon="content" size="large" color="green" />}
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
                if (showOnlyDifferences && !isDifferent) return null;

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
  getEditorData: PropTypes.func.isRequired,
  registerSaveAction: PropTypes.func.isRequired,
  setDirty: PropTypes.func.isRequired,
  goToSnapshot: PropTypes.func.isRequired,
  redirect: PropTypes.func.isRequired,
  onUpdateEntry: PropTypes.func.isRequired,
  snapshot: PropTypes.shape({
    snapshot: PropTypes.object,
  }),
  widgets: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.oneOfType([
        PropTypes.shape({
          id: PropTypes.string,
          type: PropTypes.string,
          linkType: PropTypes.string,
        }),
        PropTypes.shape({
          id: PropTypes.string,
          type: PropTypes.string,
          items: PropTypes.shape({
            type: PropTypes.string,
            linkType: PropTypes.string,
          }),
        }),
      ]),
    })
  ).isRequired,
};

export default SnapshotComparator;
export { SnapshotComparator };
