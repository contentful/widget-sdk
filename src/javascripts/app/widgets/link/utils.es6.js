export function getAvailableContentTypes (space, field) {
  return space.getContentTypes({order: 'name', limit: 1000})
    .then(function (res) {
      return _.filter(res.items, canCreate(field));
    });
}


function canCreate (field) {
  const validations = [].concat(field.validations || [], field.itemValidations || []);
  const found = _.find(validations, function (v) {
    return Array.isArray(v.linkContentType) || _.isString(v.linkContentType);
  });
  let linkedCts = found && found.linkContentType;
  linkedCts = _.isString(linkedCts) ? [linkedCts] : linkedCts;

  return function (ct) {
    const canLink = !linkedCts || linkedCts.indexOf(ct.sys.id) > -1;
    return !!ct.sys.publishedVersion && canLink;
  };
}
