import React from 'react';
import PropTypes from 'prop-types';
import { get as getAtPath } from 'lodash';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import cn from 'classnames';
import { Note, Spinner, TextLink, Paragraph } from '@contentful/forma-36-react-components';

import { openInputDialog } from 'app/InputDialogComponent';
import { useSavedViews } from './useSavedViews';
import { SortableTree } from './Tree';
import { viewPropTypes } from './useView';
import { Portal } from 'core/components/Portal';
import { SavedViewsLink } from './Link';

const styles = {
  wrapper: css({
    height: '100%',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  }),
  menu: css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flexGrow: 1,
    backgroundColor: 'transparent',
  }),
  folders: css({
    flex: '1 0 200px',
    overflowY: 'auto',
    paddingTop: '10px',
  }),
  actions: css({
    borderTop: '1px solid rgb(211, 220, 224)',
    flex: '0 1 75px',
    height: '75px',
    maxHeight: '75px',
    backgroundColor: tokens.colorElementLightest,
    padding: tokens.spacingL,
  }),
  empty: css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: tokens.spacingL,
  }),
  emptyMessage: css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  }),
  emptyCta: css({
    marginTop: 'auto',
  }),
  stateWrapper: css({
    backgroundColor: tokens.colorElementLightest,
    height: '100%',
    borderRight: `1px solid ${tokens.colorElementDarkest}`,
    boxShadow: tokens.boxShadowDefault,
  }),
  errorWrapper: css({
    padding: tokens.spacingXs,
  }),
  loadingWrapper: css({
    padding: `${tokens.spacing3Xl} ${tokens.spacingM}`,
    textAlign: 'center',
  }),
};

const EmptyState = ({ canEdit, restoreDefaultViews }) => {
  return (
    <div data-test-id="empty-state" className={styles.empty}>
      <div>
        <strong>There are no views yet</strong>
        <Paragraph>
          A view displays a list of entries you searched for.
          {canEdit
            ? ' By saving a view to this list, you will be able to re-use it later.'
            : ' Your administrator has not set up any views yet.'}
        </Paragraph>
      </div>
      <div className={styles.emptyCta}>
        {canEdit && (
          <TextLink testId="button-restore" onClick={restoreDefaultViews} icon="Cycle">
            Restore default views
          </TextLink>
        )}
      </div>
    </div>
  );
};

EmptyState.propTypes = {
  canEdit: PropTypes.bool.isRequired,
  restoreDefaultViews: PropTypes.func.isRequired,
};

const onAddFolderClick = (createScopedFolder) => async () => {
  const title = await openInputDialog({
    title: 'Add folder',
    confirmLabel: 'Add folder',
    message: 'Please provide a name for your new folder:',
    maxLength: 32,
    intent: 'positive',
    isValid: (value) => {
      const trimmed = (value || '').trim();
      return trimmed.length > 0 && trimmed.length <= 32;
    },
  });
  if (title) {
    await createScopedFolder(title);
  }
};

export const View = ({
  entityType,
  viewType,
  listViewContext,
  onSelectSavedView,
  setSelectedView,
}) => {
  const [{ isLoading, hasError, folders }, savedViewsActions] = useSavedViews({
    entityType,
    viewType,
  });

  if (hasError) {
    return (
      <div data-test-id="view-error" className={cn(styles.stateWrapper, styles.errorWrapper)}>
        <Note title="Failed to load views" noteType="warning">
          Please refresh the page.
        </Note>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div data-test-id="view-loading" className={cn(styles.stateWrapper, styles.loadingWrapper)}>
        Loading <Spinner />
      </div>
    );
  }

  const {
    resetScopedFolders,
    createScopedFolder,
    canEditScopedFolders,
    fetchFolders,
  } = savedViewsActions;

  const canEdit = canEditScopedFolders();

  // The default folder is ensured (minimal length is 1):
  const isEmpty =
    getAtPath(folders, ['length']) === 1 && getAtPath(folders, [0, 'views', 'length']) === 0;

  return (
    <div data-test-id="view-wrapper" className={styles.wrapper}>
      <div className={styles.menu}>
        <div className={styles.folders}>
          {isEmpty ? (
            <EmptyState canEdit={canEdit} restoreDefaultViews={resetScopedFolders} />
          ) : (
            <SortableTree
              folders={folders}
              listViewContext={listViewContext}
              savedViewsActions={savedViewsActions}
              onSelectSavedView={onSelectSavedView}
            />
          )}
        </div>
        {canEdit && (
          <div className={styles.actions}>
            <TextLink
              testId="button-add-folder"
              onClick={onAddFolderClick(createScopedFolder)}
              icon="FolderCreate">
              Add folder
            </TextLink>
          </div>
        )}
      </div>
      <Portal id="saved-views-link-portal-entry">
        <SavedViewsLink
          entityType={entityType}
          listViewContext={listViewContext}
          onViewSaved={(view, newViewType) => {
            onSelectSavedView(view);
            if (newViewType !== viewType) {
              setSelectedView(newViewType);
            } else {
              fetchFolders();
            }
          }}
        />
      </Portal>
    </div>
  );
};

View.propTypes = {
  entityType: PropTypes.oneOf(['entry', 'asset']).isRequired,
  onSelectSavedView: PropTypes.func.isRequired,
  viewType: viewPropTypes.isRequired,
  listViewContext: PropTypes.shape({
    getView: PropTypes.func.isRequired,
    setView: PropTypes.func.isRequired,
  }).isRequired,
  setSelectedView: PropTypes.func.isRequired,
};
