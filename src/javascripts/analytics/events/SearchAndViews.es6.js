import { extend } from 'lodash';
import { track as analyticsTrack } from 'analytics/Analytics.es6';
import { getMigrationSuccessCount } from 'data/ViewMigrator.es6';

const PREFIX = 'search:';
const track = (e, data) => analyticsTrack(PREFIX + e, data);
const isStoredView = v => v && v.id;

export function searchPerformed(view, resultCount = 0) {
  track('search_performed', extend(query(view), { result_count: resultCount }));
}

export function forScopedViews(viewType) {
  return {
    viewCreated: (view, folder) => viewCreated(viewType, view, folder),
    viewDeleted: view => viewDeleted(viewType, view),
    viewLoaded: view => viewLoaded(viewType, view),
    viewTitleEdited: view => viewEdited(viewType, view, 'title'),
    viewRolesEdited: view => viewEdited(viewType, view, 'roles')
  };
}

function viewCreated(viewType, view, folder) {
  if (isStoredView(view)) {
    track(
      'view_created',
      extend(query(view), {
        view_type: viewType,
        view_id: view.id,
        folder_id: folder && folder.id,
        folder_title: folder && folder.title
      })
    );
  }
}

function viewDeleted(viewType, view) {
  if (isStoredView(view)) {
    track('view_deleted', {
      view_type: viewType,
      view_id: view.id
    });
  }
}

function viewLoaded(viewType, view) {
  if (isStoredView(view)) {
    track(
      'view_loaded',
      extend({ view_type: viewType, view_id: view.id }, details(view), query(view))
    );
  }
}

function viewEdited(viewType, view, changedProperty = null) {
  if (isStoredView(view)) {
    track(
      'view_edited',
      extend(details(view), {
        view_type: viewType,
        view_id: view.id,
        change_property: changedProperty
      })
    );
  }
}

export function searchTermsMigrated(newUIConfig, endpoint) {
  const { migratedCount, failedCount } = getMigrationSuccessCount(newUIConfig);
  track(`search_terms_migrated`, {
    view_count_migrated: migratedCount,
    view_count_migration_failed: failedCount,
    endpoint
  });
}

function details({ title, roles }) {
  return {
    view_title: title,
    view_roles: Array.isArray(roles) ? roles.join(',') : roles || null
  };
}

function query({ searchText = null, contentTypeId = null }) {
  return {
    content_type_id: contentTypeId,
    search_query: searchText // We keep this for compatibility with schemas for now.
  };
}
