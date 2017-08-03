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
  track('view_created', extend(query(view), {
    view_id: view.id,
    folder_id: folder && folder.id,
    folder_title: folder && folder.title
  }));
}

export function viewTitleEdited (view) {
  viewEdited(view, 'title');
}

export function viewRolesEdited (view) {
  viewEdited(view, 'roles');
}

export function viewDeleted (view) {
  track('view_deleted', {view_id: view.id});
}

export function viewLoaded (view) {
  track('view_loaded', extend(
    {view_id: view.id},
    details(view),
    query(view)
  ));
}

function viewEdited (view, changedProperty = null) {
  track('view_edited', extend(details(view), {
    view_id: view.id,
    change_property: changedProperty
  }));
}

function details ({title, roles}) {
  return {
    view_title: title,
    view_roles: Array.isArray(roles) ? roles.join(',') : (roles || null)
  };
}

function query ({searchTerm, contentTypeId}) {
  return {
    search_query: searchTerm || null,
    content_type_id: contentTypeId || null
  };
}
