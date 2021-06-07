import React, { Fragment, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Folder, View } from './TreeItems';
import { SortableContainer as Container, SortableElement as Element } from 'react-sortable-hoc';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { useFolder } from './useFolder';
import { savedViewsActionsPropTypes } from './useSavedViews';
import { flattenFolders, getVisibleViews, initReorder } from './helpers';

const styles = {
  sortable: css({
    transition: 'box-shadow 250ms ease-in-out',
  }),
  helperClass: css({
    backgroundColor: tokens.colorElementLightest,
    boxShadow: tokens.boxShadowHeavy,
    transition: 'box-shadow 250ms ease-in-out',
  }),
};

const SortableElement = Element((props) => <div {...props} />);
const SortableContainer = Container((props) => (
  <div data-test-id="sortable-container" {...props} />
));

const Items = ({
  items,
  onSelectSavedView: onSelectView,
  isDragging,
  listViewContext,
  savedViewsActions,
}) => {
  const [currentViewId, setCurrentViewId] = useState(listViewContext.getView().id);
  const [isSortingFolders, setIsSortingFolders] = useState(false);
  const [{ isClosed }, { toggleClosed }] = useFolder();

  const setSortingViews = () => !isDragging && setIsSortingFolders(false);
  const setSortingFolders = () => !isDragging && setIsSortingFolders(true);

  const onSelectSavedView = (view) => {
    listViewContext.setView(view);
    onSelectView(view);
    setCurrentViewId(view.id);
  };

  const { canEditScopedFolders, getRoleAssignment } = savedViewsActions;

  const canEdit = canEditScopedFolders();
  const roleAssignment = getRoleAssignment();

  if (isSortingFolders) {
    const [defaultFolder, ...remainingFolders] = items.filter(({ isFolder }) => isFolder);
    return (
      <Fragment>
        {getVisibleViews(defaultFolder.views, roleAssignment).map((view) => (
          <View
            testId={`nested-view-${view.id}`}
            currentViewId={currentViewId}
            key={view.id}
            onMouseOver={setSortingViews}
            onSelectSavedView={onSelectSavedView}
            savedViewsActions={savedViewsActions}
            view={view}
          />
        ))}

        {remainingFolders.map((item, index) => {
          const { views, id, folderId } = item;
          const isFolderClosed = isClosed[folderId];
          const visibleViews = getVisibleViews(views, roleAssignment);

          const isEmpty = visibleViews.length < 1;
          return (
            <SortableElement
              disabled={!canEdit}
              className={styles.sortable}
              key={`draggable-folders-${id}-${index + 1}`}
              index={index + 1}
              collection="folders">
              <Folder
                testId={`draggable-folder-${id}`}
                currentViewId={currentViewId}
                folder={item}
                isFolderClosed={isFolderClosed}
                isEmpty={isEmpty}
                isHidden={!canEdit && isEmpty}
                onClick={() => toggleClosed(item)}
                onMouseOver={setSortingFolders}
                savedViewsActions={savedViewsActions}
              />
              {visibleViews.map((view) => (
                <View
                  testId={`nested-view-${view.id}`}
                  currentViewId={currentViewId}
                  isFolderClosed={isFolderClosed}
                  key={view.id}
                  onMouseOver={setSortingViews}
                  onSelectSavedView={onSelectSavedView}
                  savedViewsActions={savedViewsActions}
                  view={view}
                />
              ))}
            </SortableElement>
          );
        })}
      </Fragment>
    );
  }

  return getVisibleViews(items, roleAssignment).map((item, index) => {
    const { isFolder, views, id, folderId } = item;
    const isDefaultFolder = index === 0;
    if (isDefaultFolder) {
      return null;
    }

    const isFolderClosed = isClosed[folderId];

    const visibleViews = getVisibleViews(views, roleAssignment);
    const isEmpty = visibleViews.length < 1;
    return (
      <SortableElement
        disabled={!canEdit}
        key={`draggable-views-${id}-${index}`}
        index={index}
        collection="views">
        {isFolder ? (
          <Folder
            testId={`draggable-folder-${id}`}
            currentViewId={currentViewId}
            folder={item}
            isFolderClosed={isFolderClosed}
            isEmpty={isEmpty}
            isHidden={!canEdit && visibleViews.length < 1}
            onClick={() => toggleClosed(item)}
            onMouseOver={setSortingFolders}
            savedViewsActions={savedViewsActions}
          />
        ) : (
          <View
            testId={`draggable-view-${id}`}
            currentViewId={currentViewId}
            isFolderClosed={isFolderClosed}
            onMouseOver={setSortingViews}
            onSelectSavedView={onSelectSavedView}
            savedViewsActions={savedViewsActions}
            view={item}
          />
        )}
      </SortableElement>
    );
  });
};

Items.propTypes = {
  items: PropTypes.array.isRequired,
  isDragging: PropTypes.bool,
  savedViewsActions: savedViewsActionsPropTypes.isRequired,
  onSelectSavedView: PropTypes.func.isRequired,
};

export const SortableTree = ({
  folders,
  savedViewsActions,
  listViewContext,
  onSelectSavedView,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const items = useMemo(() => flattenFolders(folders), [folders]);

  const { reorderViews, reorderFolders } = initReorder(savedViewsActions);

  const onSortEnd = async ({ oldIndex, newIndex, collection }) => {
    setIsDragging(false);
    if (oldIndex === newIndex) {
      return;
    }
    if (collection === 'folders') {
      await reorderFolders(oldIndex, newIndex);
    } else {
      await reorderViews(items, oldIndex, newIndex);
    }
  };

  return (
    <SortableContainer
      helperClass={styles.helperClass}
      lockAxis="y"
      distance={10}
      updateBeforeSortStart={() => setIsDragging(true)}
      onSortEnd={onSortEnd}>
      <Items
        items={items}
        isDragging={isDragging}
        savedViewsActions={savedViewsActions}
        onSelectSavedView={onSelectSavedView}
        listViewContext={listViewContext}
      />
    </SortableContainer>
  );
};

SortableTree.propTypes = {
  savedViewsActions: savedViewsActionsPropTypes.isRequired,
  folders: PropTypes.array.isRequired,
  onSelectSavedView: PropTypes.func.isRequired,
  listViewContext: PropTypes.shape({
    getView: PropTypes.func.isRequired,
    setView: PropTypes.func.isRequired,
  }).isRequired,
};
