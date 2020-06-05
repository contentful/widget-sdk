import React, { useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import { cloneDeep, omit } from 'lodash';
import { Folder, View } from './TreeItems';
import { SortableContainer as Container, SortableElement as Element } from 'react-sortable-hoc';
import createListViewPersistor from 'data/ListViewPersistor';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import useFolder from './useFolder';
import * as accessChecker from 'access_control/AccessChecker';
import { savedViewsActionsPropTypes } from './useSavedViews';

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

/**
 * If the view has a `roles` property we only return true if the
 * user has one of the roles given.
 *
 * We always return true if the user is an admin or if the view
 * does not have the `roles` property.
 */
const isVisibleForAssignedRoles = (view, membership) => {
  if (!membership.admin && view.roles) {
    return view.roles.some((viewRoleId) => {
      return membership.roles.some((role) => viewRoleId === role.sys.id);
    });
  }
  return true;
};

const isContentTypeReadable = (contentTypeId) => {
  if (typeof contentTypeId === 'string') {
    const can = accessChecker.canPerformActionOnEntryOfType;
    const canRead = can('read', contentTypeId);
    const canCreate = can('create', contentTypeId);

    // If a user can read entries of a specific content type created by
    // themselves ONLY, then calls to `can('read', ctId)` will return `false`.
    // While the return value is correct (a user cannot, in general, read all
    // entries of a type), it causes confusion by hiding views if user's roles
    // contain such a policy. To mitigate that we also check if they can create
    // entries of a given CT.
    return canRead || canCreate;
  } else {
    return true;
  }
};

const isViewVisible = (view, roleAssignment) => {
  if (!view || !isContentTypeReadable(view.contentTypeId)) {
    return false;
  }
  if (roleAssignment) {
    return isVisibleForAssignedRoles(view, roleAssignment.membership);
  }
  return true;
};

const getVisibleViews = (views = [], roleAssignment) => {
  return views.filter((view) => isViewVisible(view, roleAssignment));
};

const Items = ({
  items,
  entityType,
  onSelectSavedView: onSelectView,
  isDragging,
  savedViewsActions,
}) => {
  const listViewPersistor = createListViewPersistor({ entityType });
  const [currentViewId, setCurrentViewId] = useState(listViewPersistor.readKey('id'));
  const [isSortingFolders, setIsSortingFolders] = useState(false);
  const [{ isClosed }, { toggleClosed }] = useFolder();

  const setSortingViews = () => !isDragging && setIsSortingFolders(false);
  const setSortingFolders = () => !isDragging && setIsSortingFolders(true);

  const onSelectSavedView = (view) => {
    listViewPersistor.save(view);
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
    if (isDefaultFolder) return null;

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
  entityType: PropTypes.oneOf(['entry', 'asset']).isRequired,
  onSelectSavedView: PropTypes.func.isRequired,
};

export const flattenFolders = (folders) => {
  return folders.reduce((acc, { views, ...folder }) => {
    return [
      ...acc,
      { ...folder, folderId: folder.id, isFolder: true, views },
      ...views.map((view) => ({
        ...view,
        folderId: folder.id,
      })),
    ];
  }, []);
};

export const deflattenFolders = (flattened) => {
  let pointer = 0;
  return flattened.reduce((acc, { isFolder, ...item }) => {
    if (isFolder) {
      if (acc[pointer]) pointer++;
      return [...acc, { ...item, views: [] }];
    }
    const views = [...(acc[pointer]?.views || []), item];
    acc[pointer] = { ...acc[pointer], views };
    return acc;
  }, []);
};

export const sanitizeFolders = (folders) => {
  const temporaryProperties = ['folderId', 'isFolder'];
  return folders.map((folder) => ({
    ...omit(folder, temporaryProperties),
    views: folder.views.map((view) => omit(view, temporaryProperties)),
  }));
};

export const reorderArray = (array, from, to) => {
  const clone = cloneDeep(array);
  const items = clone.splice(from, 1);
  clone.splice(to, 0, ...items);
  return clone;
};

export const initReorder = ({ getPreparedScopedFolders, saveScopedFolders }) => ({
  reorderFolders: async (oldIndex, newIndex) => {
    const folders = await getPreparedScopedFolders();
    const updated = reorderArray(folders, oldIndex, newIndex);
    return saveScopedFolders(updated);
  },
  reorderViews: async (items, oldIndex, newIndex) => {
    const reordered = reorderArray(items, oldIndex, newIndex);
    const folders = deflattenFolders(reordered);
    const updated = sanitizeFolders(folders);
    await saveScopedFolders(updated);
  },
});

const SortableTree = ({ folders, entityType, savedViewsActions, onSelectSavedView }) => {
  const [isDragging, setIsDragging] = useState(false);

  const items = flattenFolders(folders);

  const { reorderViews, reorderFolders } = initReorder(savedViewsActions);

  const onSortEnd = async ({ oldIndex, newIndex, collection }) => {
    setIsDragging(false);
    if (oldIndex === newIndex) return;
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
        entityType={entityType}
        onSelectSavedView={onSelectSavedView}
      />
    </SortableContainer>
  );
};

SortableTree.propTypes = {
  savedViewsActions: savedViewsActionsPropTypes.isRequired,
  folders: PropTypes.array.isRequired,
  entityType: PropTypes.oneOf(['entry', 'asset']).isRequired,
  onSelectSavedView: PropTypes.func.isRequired,
};

export default SortableTree;
