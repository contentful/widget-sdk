import { isEmpty, omitBy } from 'lodash';
import { addUserOrgSpace } from './Decorators.es6';
import { getSchema } from 'analytics/snowplow/Schemas.es6';

// TODO: Update our snowplow integration to support contexts in a cleaner
// and more abstracted manner. Basically, move em out from the transformers
// into something more top level since it's common duplicated behaviour
export default function(_, eventData) {
  const data = addUserOrgSpace((_, data) => {
    return {
      data: omitBy(
        {
          element_id: data.elementId, // required
          group_id: data.groupId, // required
          from_state: data.fromState, // required
          to_state: data.toState // optional
        },
        isEmpty
      )
    };
  })(_, eventData).data;

  if (eventData.contentPreview) {
    const contentPreview = addUserOrgSpace((_, data) => {
      const { previewName, previewId, contentTypeName, contentTypeId } = data.contentPreview;

      return {
        schema: getSchema('content_preview').path,
        data: omitBy(
          {
            preview_name: previewName,
            preview_id: previewId,
            content_type_name: contentTypeName,
            content_type_id: contentTypeId
          },
          isEmpty
        )
      };
    })(_, eventData);

    return {
      data,
      contexts: [contentPreview]
    };
  } else {
    return {
      data
    };
  }
}
