import {extend} from 'lodash';
import {track as analyticsTrack} from 'analytics/Analytics';

const PREFIX = 'search:';
const track = (e, data) => analyticsTrack(PREFIX + e, data);

export function searchPerformed (view, resultCount = 0) {
  track('search_performed', extend(
    query(view),
    {result_count: resultCount}
  ));
}

export function viewCreated (view, folder) {
  track('view_created', extend(
    basic(view, folder),
    query(view)
  ));
}

export function viewTitleEdited (view, folder) {
  viewEdited(view, folder, 'title');
}

export function viewRolesEdited (view, folder) {
  viewEdited(view, folder, 'roles');
}

export function viewDeleted (view) {
  track('view_deleted', {view_id: view.id});
}

export function viewLoaded (view, folder) {
  track('view_loaded', extend(
    basic(view, folder),
    details(view),
    query(view)
  ));
}

function viewEdited (view, folder, changedProperty = null) {
  track('view_edited', extend(
    basic(view, folder),
    details(view),
    {change_property: changedProperty}
  ));
}

function basic (view, folder) {
  return {
    folder_id: folder && folder.id,
    folder_name: folder && folder.title,
    view_id: view.id
  };
}

function details ({title, roles}) {
  return {
    view_title: title,
    view_roles: Array.isArray(roles) ? roles.join(',') : roles
  };
}

function query ({searchTerm, contentTypeId}) {
  return {
    search_query: searchTerm,
    content_type_id: contentTypeId
  };
}
