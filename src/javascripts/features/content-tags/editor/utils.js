import { sortBy } from 'lodash';

export const tagPayloadToValue = (tag) => ({ value: tag.sys.id, label: tag.name });
export const tagsPayloadToValues = (tags) => tags.map(tagPayloadToValue);

export const orderByLabel = (tags) => {
  return sortBy(tags, [(tag) => tag.label.toLowerCase()]);
};

export const idList = (tags) => tags.map((tag) => tag.sys.id);

export const summarizeTags = (tags) => {
  if (!Array.isArray(tags) || tags.length === 0) {
    return '';
  }

  if (tags.length === 1) {
    return tags[0].label;
  }

  return `${tags[0].label} and ${tags.length - 1} more`;
};

export function tagLink(id) {
  return {
    sys: {
      id,
      type: 'Link',
      linkType: 'Tag',
    },
  };
}
