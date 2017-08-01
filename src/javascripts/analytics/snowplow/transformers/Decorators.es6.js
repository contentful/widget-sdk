import { merge } from 'lodash';

const noopTransformer = (_, data) => data;

export function addUserOrgSpace (transformer = noopTransformer) {
  return (event, data) => merge(transformer(event, data), {
    data: {
      organization_id: data.organizationId,
      space_id: data.spaceId,
      executing_user_id: data.userId
    }
  });
}
