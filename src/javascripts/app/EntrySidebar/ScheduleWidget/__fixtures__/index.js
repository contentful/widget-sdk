const contentType = {
  description: '',
  displayField: 'title-id',
  fields: [
    {
      apiName: 'title',
      disabled: false,
      id: 'title-id',
      localized: false,
      name: 'Title',
      omitted: false,
      required: false,
      type: 'Symbol',
      validations: [],
    },
  ],
  name: 'Content Type',
  sys: {
    createdAt: new Date().toISOString(),
    environment: {
      sys: {
        id: 'master',
        type: 'Link',
        linkType: 'Environment',
      },
    },
    id: 'ct-id',
    revision: 1,
    space: {
      type: 'Link',
      linkType: 'Space',
      id: 'space-id',
    },
    type: 'ContentType',
    updatedAt: new Date().toISOString(),
  },
};

const entry = {
  fields: {
    [contentType.displayField]: {
      'en-US': 'Entry title',
    },
  },
  sys: {
    contentType: {
      sys: {
        type: 'Link',
        linkType: 'ContentType',
        id: contentType.sys.id,
      },
    },
    createdAt: new Date().toISOString(),
    createdBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: 'user-id',
      },
    },
    environment: contentType.sys.environment,
    id: 'entry-id',
    space: contentType.sys.space,
    type: 'Entry',
    version: 1,
  },
};

const entryInfo = {
  contentType,
  contentTypeId: contentType.sys.id,
  type: 'Entry',
};

const asset = {
  fields: {
    [contentType.displayField]: {
      'en-US': 'Asset title',
    },
  },
  sys: {
    contentType: {
      sys: {
        type: 'Link',
        linkType: 'ContentType',
        id: contentType.sys.id,
      },
    },
    createdAt: new Date().toISOString(),
    createdBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: 'user-id',
      },
    },
    environment: contentType.sys.environment,
    id: 'asset-id',
    space: contentType.sys.space,
    type: 'Asset',
    version: 1,
  },
};

const assetInfo = {
  contentType,
  contentTypeId: contentType.sys.id,
  type: 'Asset',
};

const scheduledActions = [
  {
    sys: {
      id: 'action-id-1',
      type: 'ScheduledAction',
    },
    entity: {
      sys: {
        id: 'entity-id-1',
        linkType: 'Entry',
      },
    },
    action: 'publish',
    status: 'scheduled',
    scheduledFor: {
      datetime: new Date().toISOString(),
    },
  },
  {
    sys: {
      id: 'action-id-2',
      type: 'ScheduledAction',
    },
    entity: {
      sys: {
        linkType: 'Release',
        id: 'release-id-1',
      },
    },
    action: 'publish',
    status: 'scheduled',
    scheduledFor: {
      datetime: new Date().toISOString(),
    },
  },
  {
    sys: {
      id: 'action-id-3',
      type: 'ScheduledAction',
    },
    entity: {
      sys: {
        id: 'entity-id-3',
        linkType: 'Entry',
      },
    },
    action: 'unpublish',
    status: 'scheduled',
    scheduledFor: {
      datetime: new Date().toISOString(),
    },
  },
  {
    sys: {
      id: 'action-id-4',
      type: 'ScheduledAction',
    },
    entity: {
      sys: {
        id: 'entity-id-4',
        linkType: 'Entry',
      },
    },
    action: 'publish',
    status: 'scheduled',
    scheduledFor: {
      datetime: new Date(Date.now() / 2).toISOString(),
    },
  },
  {
    sys: {
      id: 'action-id-5',
      type: 'ScheduledAction',
    },
    entity: {
      sys: {
        linkType: 'Release',
        id: 'release-id-2',
      },
    },
    action: 'unpublish',
    status: 'scheduled',
    scheduledFor: {
      datetime: new Date().toISOString(),
    },
  },
];

const scheduledActionsForAssets = [
  {
    sys: {
      id: 'action-id-1',
      type: 'ScheduledAction',
    },
    entity: {
      sys: {
        id: 'entity-id-1',
        linkType: 'Asset',
      },
    },
    action: 'publish',
    status: 'scheduled',
    scheduledFor: {
      datetime: new Date().toISOString(),
    },
  },
  {
    sys: {
      id: 'action-id-3',
      type: 'ScheduledAction',
    },
    entity: {
      sys: {
        id: 'entity-id-3',
        linkType: 'Asset',
      },
    },
    action: 'unpublish',
    status: 'scheduled',
    scheduledFor: {
      datetime: new Date().toISOString(),
    },
  },
  {
    sys: {
      id: 'action-id-4',
      type: 'ScheduledAction',
    },
    entity: {
      sys: {
        id: 'entity-id-4',
        linkType: 'Asset',
      },
    },
    action: 'publish',
    status: 'scheduled',
    scheduledFor: {
      datetime: new Date(Date.now() / 2).toISOString(),
    },
  },
];

export {
  scheduledActions,
  scheduledActionsForAssets,
  contentType,
  entry,
  entryInfo,
  asset,
  assetInfo,
};
