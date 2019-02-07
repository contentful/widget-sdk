import _ from 'lodash';

const orderedKeys = ['name', 'description', 'displayField', 'fields', 'sys'];

export default function getContentTypePreview(contentType) {
  return contentType
    .endpoint()
    .headers({ 'X-Contentful-Skip-Transformation': false })
    .get()
    .then(orderPreviewKeys);
}

getContentTypePreview.fromData = contentType => {
  return Promise.resolve(contentType.data)
    .then(orderPreviewKeys)
    .then(omitApiName);
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

function omitApiName(data) {
  data.fields = _.map(data.fields, field => _.omit(field, 'apiName'));
  return data;
}
