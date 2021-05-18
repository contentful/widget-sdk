import _ from 'lodash';
import { fromInternal } from 'widgets/PublicContentType';

const orderedKeys = ['name', 'description', 'displayField', 'fields', 'sys'];

export function getContentTypePreview(internalContentTypeData) {
  return _.flow(fromInternal, orderPreviewKeys)(internalContentTypeData);
}

// We rely on the fact the keys are displayed in the order they
// were added.
function orderPreviewKeys(internalContentTypeData) {
  const ordered = _.transform(
    orderedKeys,
    (preview, key) => {
      preview[key] = internalContentTypeData[key];
    },
    {}
  );
  return _.defaults(ordered, internalContentTypeData);
}
