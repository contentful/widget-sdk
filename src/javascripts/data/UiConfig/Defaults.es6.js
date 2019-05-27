import { extend, map } from 'lodash';
import * as random from 'utils/Random.es6';
import mimetype from '@contentful/mimetype';
import * as SystemFields from 'data/SystemFields.es6';

const STATUSES = ['Published', 'Changed', 'Draft', 'Archived'];

/**
 * This modules exports functions that generate default payoads for the
 * UiConfig.
 */

export function getEntryViews(contentTypes) {
  return [
    {
      id: 'default',
      title: 'Views',
      views: [
        {
          id: random.id(),
          title: 'All',
          order: SystemFields.getDefaultOrder(),
          displayedFieldIds: SystemFields.getDefaultFieldIds(),
          searchText: '',
          searchFilters: []
        }
      ]
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

export function getAssetViews() {
  return [
    {
      id: 'default',
      title: 'Views',
      views: [
        {
          id: random.id(),
          title: 'All'
        }
      ]
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

function createStatusView(status) {
  return {
    title: status,
    searchText: '',
    searchFilters: [['__status', '', status.toLowerCase()]],
    id: random.id()
  };
}

function createEntryStatusView(status) {
  return extend(createStatusView(status), {
    contentTypeId: null,
    order: SystemFields.getDefaultOrder(),
    displayedFieldIds: SystemFields.getDefaultFieldIds()
  });
}

function contentTypeViews(contentTypes) {
  return map(contentTypes, createContentTypeView);
}

export function createContentTypeView(ctId, title) {
  return {
    title,
    contentTypeId: ctId,
    id: random.id(),
    order: SystemFields.getDefaultOrder(),
    displayedFieldIds: SystemFields.getDefaultFieldIds(),
    searchText: '',
    searchFilters: []
  };
}

function fileTypeViews() {
  return map(mimetype.getGroupNames(), (title, label) => {
    return {
      title,
      searchText: '',
      searchFilters: [['mimetype_group', '', label]],
      id: random.id()
    };
  });
}

export function getPrivateViews(userId) {
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
