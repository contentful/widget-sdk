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
        displayedFieldIds: systemFields.getDefaultFieldIds(),
        searchText: '',
        searchFilters: []
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
    displayedFieldIds: systemFields.getDefaultFieldIds(),
    searchText: '',
    searchFilters: []
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
    displayedFieldIds: systemFields.getDefaultFieldIds(),
    searchText: '',
    searchFilters: []
  };
}

function fileTypeViews () {
  return map(mimetype.getGroupNames(), (title, label) => {
    return {
      title,
      searchText: '',
      searchFilters: [['mimetype_group', '', label]],
      id: random.id()
    };
  });
}

export function getPrivateViews (userId) {
  return [
    {
      id: 'default',
      title: 'My views',
      views: [
        {
          id: random.id(),
          title: 'Created by me',
          searchText: '',
          searchFilters: [['sys.createdBy.sys.id', '', userId]]
        },
        {
          id: random.id(),
          title: 'Updated by me',
          searchText: '',
          searchFilters: [['sys.updatedBy.sys.id', '', userId]]
        }
      ]
    }
  ];
}
