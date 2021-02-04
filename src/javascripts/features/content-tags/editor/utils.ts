import { camelCase, groupBy, min, sortBy, upperFirst } from 'lodash';
import { Tag } from '@contentful/types';
import { TagOption } from '../types';
import { LinkSys } from 'core/services/SpaceEnvContext/types';
import * as stringUtils from 'utils/StringUtils';

export const tagPayloadToOption = (tag: Tag): TagOption => ({
  value: tag.sys.id,
  label: tag.name,
});
export const tagsPayloadToOptions = (tags: Tag[]): TagOption[] => tags.map(tagPayloadToOption);

export const orderByLabel = <T extends TagOption>(tags: T[]): T[] => {
  return sortBy(tags, [(tag) => tag.label.toLowerCase()]);
};

export const idList = (tags: Tag[]): string[] => tags.map((tag) => tag.sys.id);

export function tagLink(id: string): { sys: LinkSys } {
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

export const getFirstDelimiterIndex = (value: string, delimiters: string[]): number => {
  const index = (delimiter: string): number => value.indexOf(delimiter);
  return min(delimiters.map(index).filter((index) => index >= 0)) || -1;
};

export const groupForLabel = (label: string, delimiters: string[]) => {
  const delimiterIndex = getFirstDelimiterIndex(label, delimiters);
  if (delimiterIndex <= 0) {
    return DEFAULT_GROUP;
  } else {
    return upperFirst(camelCase(label.slice(0, delimiterIndex)));
  }
};

export const groupByField = <T extends Record<string, any>>(
  tags: T[],
  field: keyof T,
  delimiters: string[]
) => groupBy(tags, (tag) => groupForLabel(tag[field], delimiters));

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

export const applyGroups = <T extends TagOption>(tags: T[], groups) => {
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

export const groupByName = <T extends TagOption>(tags: T[], minGroupSize = 2) =>
  applyMinimumGroupSize(groupByField(tags, 'label', GROUP_DELIMITERS), minGroupSize);

export const shouldAddInlineCreationItem = (
  canManageTags,
  search,
  localFilteredTags,
  selectedTags
) => {
  return (
    canManageTags &&
    search &&
    !localFilteredTags.some(
      (tag) => tag.label === search || tag.value === stringUtils.toIdentifier(search)
    ) &&
    !selectedTags.some((tag) => tag.value === stringUtils.toIdentifier(search))
  );
};
