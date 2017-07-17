/**
 * @ngdoc service
 * @name analytics/snowplow/transformers/DocsSidebar
 * @description
 * Exports a function that transforms data for the docs sidebar
 */


export default function (_, data) {
  return {
    data: {
      action: data.action,
      executing_user_id: data.userId,
      space_id: data.spaceId,
      organization_id: data.organizationId
    }
  };
}
