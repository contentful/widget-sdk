import { camelCase, groupBy, min, sortBy, upperFirst } from 'lodash';

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

/* fancy grouping stuff */

export const getFirstDelimiterIndex = (value, delimiters) =>
  min(delimiters.map((delimiter) => value.indexOf(delimiter)).filter((index) => index >= 0));

export const groupByField = (tags, field, delimiters) =>
  groupBy(tags, (tag) => {
    const input = tag[field].slice(0, tag[field].length);
    const delimiterIndex = getFirstDelimiterIndex(input, delimiters);
    if (!delimiterIndex || delimiterIndex <= 0) {
      return 'Uncategorized';
    } else {
      return upperFirst(camelCase(input.slice(0, delimiterIndex)));
    }
  });

export const applyMinimumGroupSize = (
  groups,
  defaultGroupName = 'Uncategorized',
  minGroupLength = 2
) => {
  if (!Array.isArray(groups[defaultGroupName])) {
    groups[defaultGroupName] = [];
  }
  Object.keys(groups).forEach((groupName) => {
    if (groups[groupName].length < minGroupLength && groupName !== defaultGroupName) {
      groups[defaultGroupName] = orderByLabel([...groups[defaultGroupName], ...groups[groupName]]);
      delete groups[groupName];
    }
  });
  return groups;
};

export const groupByName = (tags) =>
  applyMinimumGroupSize(groupByField(tags, 'label', ['.', ':', '_', '-', '#']));
