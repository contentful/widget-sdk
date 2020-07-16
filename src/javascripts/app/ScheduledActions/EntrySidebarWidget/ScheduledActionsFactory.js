export function create({ environmentId, entityId, action, scheduledAt, linkType }) {
  return {
    entity: {
      sys: {
        type: 'Link',
        linkType: linkType,
        id: entityId,
      },
    },
    environment: {
      sys: {
        type: 'Link',
        linkType: 'Environment',
        id: environmentId,
      },
    },
    scheduledFor: {
      datetime: scheduledAt,
    },
    action,
  };
}
