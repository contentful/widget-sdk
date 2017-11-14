import { extend, map } from 'lodash';
import random from 'random';
import mimetype from 'mimetype';
import systemFields from 'systemFields';

const STATUSES = ['Published', 'Changed', 'Draft', 'Archived'];

/**
 * This modules exports functions that generate default payoads for the
 * UiConfig.
 */

export function getEntryViews (contentTypes) {
  return [
    {
      id: 'default',
      title: 'Views',
      views: [{
        id: random.id(),
        title: 'All',
        order: systemFields.getDefaultOrder(),
        displayedFieldIds: systemFields.getDefaultFieldIds()
      }]
    },
    {
      id: random.id(),
      title: 'Status',
      views: STATUSES.map(createEntryStatusView)
    },
    {
      id: random.id(),
      title: 'Content Type',
      views: contentTypeViews(contentTypes)
    }
  ];
}

export function getAssetViews () {
  return [
    {
      id: 'default',
      title: 'Views',
      views: [{
        id: random.id(),
        title: 'All'
      }]
    },
    {
      id: random.id(),
      title: 'Status',
      views: STATUSES.map(createStatusView)
    },
    {
      id: random.id(),
      title: 'File Type',
      views: fileTypeViews()
    }
  ];
}

function createStatusView (status) {
  return {
    title: status,
    searchText: '',
    searchFilters: [['__status', '', status.toLowerCase()]],
    id: random.id()
  };
}

function createEntryStatusView (status) {
  return extend(createStatusView(status), {
    contentTypeId: null,
    order: systemFields.getDefaultOrder(),
    displayedFieldIds: systemFields.getDefaultFieldIds()
  });
}

function contentTypeViews (contentTypes) {
  return map(contentTypes, createContentTypeView);
}

export function createContentTypeView ({data}) {
  return {
    title: data.name,
    contentTypeId: data.sys.id,
    id: random.id(),
    order: systemFields.getDefaultOrder(),
    displayedFieldIds: systemFields.getDefaultFieldIds()
  };
}

function fileTypeViews () {
  return map(mimetype.getGroupNames(), (title, label) => {
    return {
      title,
      searchFilters: [['mimetype_group', '', label]],
      id: random.id()
    };
  });
}
