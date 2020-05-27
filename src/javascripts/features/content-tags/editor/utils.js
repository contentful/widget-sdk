import _ from 'lodash';

export const tagsPayloadToValues = (tags) => {
  return tags.map((entry) => {
    return { value: entry.sys.id, label: entry.name };
  });
};

export const orderByLabel = (tags) => {
  return _.sortBy(tags, [(tag) => tag.label.toLowerCase()]);
};
