import _ from 'lodash';
import { fromInternal } from 'widgets/PublicContentType';

const orderedKeys = ['name', 'description', 'displayField', 'fields', 'sys'];

export default function getContentTypePreview(contentType) {
  return contentType
    .endpoint()
    .headers({ 'X-Contentful-Skip-Transformation': false })
    .get()
    .then(orderPreviewKeys);
}

getContentTypePreview.fromData = (data) => {
  return Promise.resolve(data).then(fromInternal).then(orderPreviewKeys);
};

// We rely on the fact the keys are displayed in the order they
// were added.
function orderPreviewKeys(data) {
  const ordered = _.transform(
    orderedKeys,
    (preview, key) => {
      preview[key] = data[key];
    },
    {}
  );
  return _.defaults(ordered, data);
}
