import React, { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { set, get } from 'lodash';
import { css } from 'emotion';
import {
  Workbench,
  Button,
  TextLink,
  RadioButton,
  Icon,
  CheckboxField,
  FieldGroup,
  Notification
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { getModule } from 'NgRegistry';
import NavigationIcon from 'ui/Components/NavigationIcon';
import * as Permissions from 'access_control/EntityPermissions';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import * as trackVersioning from 'analytics/events/versioning';
import * as Entries from 'data/entries';
import SnapshotSelector from './SnapshotSelector';
import SnapshotPresenter from './SnapshotPresenter';
import useSelectedVersions from './useSelectedVersions';
import useEnrichedWidgets from './useEnrichedWidgets';
import { CURRENT, SNAPSHOT } from './utils';

const commonCellStyles = {
  maxWidth: '50%',
  display: 'flex',
  flex: '1 0',
  '&:first-child': {
    borderRight: '1px solid #dbdbdb'
  }
};

const commonOverlayStyles = {
  zIndex: 150,
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0
};

const styles = {
  workbenchContent: css({
    padding: 0
  }),
  actionButton: css({
    marginLeft: tokens.spacingM
  }),
  header: css({
    display: 'flex',
    backgroundColor: tokens.colorElementLightest
  }),
  headerCell: css({
    ...commonCellStyles,
    padding: `${tokens.spacingL} ${tokens.spacing3Xl}`,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${tokens.colorElementDarkest}`,
    '& > label': {
      display: 'flex',
      alignItems: 'center',
      '& > input': {
        margin: `0 ${tokens.spacingXs} 2px`
      }
    }
  }),
  cell: css({
    ...commonCellStyles,
    position: 'relative',
    borderBottom: '1px solid #eee'
  }),
  selected: css({
    '& > span': {
      display: 'inline-block !important'
    },
    zIndex: 151,
    border: ` 1px solid ${tokens.colorBlueMid}`,
    backgroundColor: 'rgba(91,159,239,0.05)',
    top: '-1px',
    left: '-1px',
    right: '-1px',
    bottom: '-1px'
  }),
  cellPresenter: css({
    flexGrow: 1,
    padding: tokens.spacing3Xl,
    paddingLeft: 0,
    maxWidth: `calc(100% - ${tokens.spacing3Xl})`
  }),
  version: css({
    color: tokens.colorTextDark,
    fontSize: tokens.fontSizeL,
    fontWeight: tokens.fontWeightDemiBold,
    paddingRight: tokens.spacing2Xs
  }),
  fieldLocale: css({
    display: 'flex'
  }),
  fieldTitle: css({
    display: 'flex',
    color: tokens.colorTextLight,
    marginBottom: '0.642857142857143em',
    justifyContent: 'space-between'
  }),
  overlayDifferent: css({
    ...commonOverlayStyles,
    cursor: 'pointer',
    textAlign: 'center',
    '& > span': {
      display: 'none',
      padding: `${tokens.spacing2Xs} ${tokens.spacingXs}`,
      fontSize: tokens.spacingS,
      fontWeight: tokens.fontWeightNormal,
      letterSpacing: '1px',
      textTransform: 'uppercase',
      background: tokens.colorBlueMid,
      color: tokens.colorWhite
    }
  }),
  overlayIdentical: css({
    ...commonOverlayStyles,
    background: 'rgba(255,255,255,0.75)'
  }),
  noPermissionInfo: css({
    marginLeft: 'auto',
    whiteSpace: 'nowrap',
    '& > i': {
      display: 'icon-block',
      marginRight: tokens.spacingXs,
      fill: tokens.colorTextLight
    }
  }),
  radio: css({
    minWidth: tokens.spacing3Xl,
    maxWidth: tokens.spacing3Xl,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  })
};

const handleSaveError = error => {
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
  ...props
}) => {
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const [
    { selectedVersions, pathsToRestore },
    { setSelectedVersionForField, setSelectAllSnapshots }
  ] = useSelectedVersions({ widgets });
  const [{ enrichedWidgets, diffCount }] = useEnrichedWidgets({ widgets, getEditorData, snapshot });

  const pathsToRestoreExist = pathsToRestore.length > 0;
  useEffect(() => {
    setDirty(pathsToRestoreExist);
  }, [pathsToRestoreExist, setDirty]);

  const editorData = getEditorData();
  const entry = get(editorData, 'entity', {});

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

    pathsToRestore.forEach(path => {
      path = Entries.internalPathToExternal(ctData, path);
      set(restoredResult, path, get(restoredSnapshot, path));
    });

    return restoredResult;
  };

  const onSave = async redirect => {
    const spaceContext = getModule('spaceContext');
    try {
      const restoredResult = prepareRestoredEntry();
      const entry = await spaceContext.cma.updateEntry(restoredResult);
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
    <Fragment>
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
                onClick={() => setSelectAllSnapshots(enrichedWidgets)}>
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
                const { code, name } = locale;
                const dataSys = get(entry, ['data', 'sys'], {});
                const canEdit = Permissions.create(dataSys).canEditFieldLocale(field.apiName, code);
                const isDisabled = field.disabled || !canEdit;
                const canRestore = isDifferent && !isDisabled;

                const onSelect = version => {
                  if (canRestore && isDifferent) {
                    setSelectedVersionForField(fieldPath, version);
                  }
                };
                const selectedFieldVersion = selectedVersions[fieldPath] || CURRENT;

                return (
                  <div className={styles.fieldLocale} key={fieldPath}>
                    {[SNAPSHOT, CURRENT].map(version => {
                      const isSelected = selectedFieldVersion === version;
                      return (
                        <div
                          className={styles.cell}
                          key={version}
                          data-test-id={`snapshots-comparator-${version}`}>
                          <div className={styles.radio}>
                            <RadioButton
                              checked={isSelected}
                              labelText={`Select ${version} version of field`}
                            />
                          </div>
                          <div className={styles.cellPresenter}>
                            <div
                              className={styles.fieldTitle}
                              data-test-id={`snapshots-comparator-${version}-field-title`}>
                              <div>
                                {field.name}
                                {hasMultipleLocales && <span>{` - ${name}`}</span>}
                              </div>
                              {isDisabled && (
                                <div className={styles.noPermissionInfo}>
                                  <Icon icon="Lock" />
                                  This field is disabled
                                </div>
                              )}
                            </div>
                            <SnapshotPresenter
                              version={version}
                              snapshot={snapshot}
                              locale={locale}
                              widget={widget}
                              editorData={editorData}
                            />
                            {canRestore ? (
                              <div
                                data-test-id={`snapshots-comparator-${version}-selector-${
                                  isSelected ? 'selected' : 'unselected'
                                }`}
                                className={
                                  isSelected
                                    ? `${styles.overlayDifferent} ${styles.selected}`
                                    : styles.overlayDifferent
                                }
                                onClick={() => onSelect(version)}>
                                {version === SNAPSHOT && (
                                  <span>Field will be restored to this version</span>
                                )}
                              </div>
                            ) : (
                              <div className={styles.overlayIdentical} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </Workbench.Content>
    </Fragment>
  );
};

SnapshotComparator.propTypes = {
  getEditorData: PropTypes.func.isRequired,
  registerSaveAction: PropTypes.func.isRequired,
  setDirty: PropTypes.func.isRequired,
  goToSnapshot: PropTypes.func.isRequired,
  redirect: PropTypes.func.isRequired,
  snapshot: PropTypes.shape({
    snapshot: PropTypes.object
  }),
  widgets: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.oneOfType([
        PropTypes.shape({
          id: PropTypes.string,
          type: PropTypes.string,
          linkType: PropTypes.string
        }),
        PropTypes.shape({
          id: PropTypes.string,
          type: PropTypes.string,
          items: PropTypes.shape({
            type: PropTypes.string,
            linkType: PropTypes.string
          })
        })
      ])
    })
  ).isRequired
};

export default SnapshotComparator;
