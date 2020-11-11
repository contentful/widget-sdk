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

export const GROUP_DELIMITERS = ['.', ':', '_', '-', '#'];
export const DEFAULT_GROUP = 'Uncategorized';

export const getFirstDelimiterIndex = (value, delimiters) =>
  min(delimiters.map((delimiter) => value.indexOf(delimiter)).filter((index) => index >= 0));

export const groupForLabel = (label, delimiters) => {
  const delimiterIndex = getFirstDelimiterIndex(label, delimiters);

  if (!delimiterIndex || delimiterIndex <= 0) {
    return DEFAULT_GROUP;
  } else {
    return upperFirst(camelCase(label.slice(0, delimiterIndex)));
  }
};

export const groupByField = (tags, field, delimiters) =>
  groupBy(tags, (tag) => groupForLabel(tag[field], delimiters));

export const applyMinimumGroupSize = (groups, minGroupLength = 2) => {
  if (!Array.isArray(groups[DEFAULT_GROUP])) {
    groups[DEFAULT_GROUP] = [];
  }

  const result = {};

  Object.keys(groups).forEach((groupName) => {
    if (groups[groupName].length < minGroupLength && groupName !== DEFAULT_GROUP) {
      result[DEFAULT_GROUP] = orderByLabel([...groups[DEFAULT_GROUP], ...groups[groupName]]);
    } else {
      result[groupName] = groups[groupName];
    }
  });

  return result;
};

export const applyGroups = (tags, groups) => {
  const result = {};

  tags.forEach((tag) => {
    let group = groupForLabel(tag.label, GROUP_DELIMITERS);
    group = groups.includes(group) ? group : DEFAULT_GROUP;

    if (!result[group]) {
      result[group] = [];
    }

    result[group].push(tag);
  });

  return result;
};

export const groupByName = (tags, minGroupSize = 2) =>
  applyMinimumGroupSize(groupByField(tags, 'label', GROUP_DELIMITERS), minGroupSize);