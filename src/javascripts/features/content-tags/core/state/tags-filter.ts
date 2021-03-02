import { TagVisibilityType, TagVisibilityOption } from 'features/content-tags/types';
type TagVisibilityOptions = Record<string, TagVisibilityOption>;

type Tag = {
  name: string;
  sys: {
    id: string;
    visibility: TagVisibilityType;
  };
};
type MatchInput = string;
type ExcludeInput = string[];
type TagsFilterOptions = {
  match?: MatchInput;
  exclude?: ExcludeInput;
  visibility?: TagVisibilityOption;
};
type TagsFilter = (options: TagsFilterOptions) => Tag[];
type FilterInputs = [string, string, Tag][];

const TAG_VISILBILITY_OPTIONS: TagVisibilityOptions = {
  ANY: 'any',
  PRIVATE: 'private',
  PUBLIC: 'public',
};

function createTagsFilter(tags: Tag[]): TagsFilter {
  const filterInputs: FilterInputs = [];
  for (const tag of tags) {
    filterInputs.push([tag.sys.id.toLowerCase(), tag.name.toLowerCase(), tag]);
  }
  return function (options: TagsFilterOptions) {
    const tagsResult: Tag[] = [];
    const { match = '', exclude = [], visibility = TAG_VISILBILITY_OPTIONS.ANY } = options;
    const normalizedMatch = match.toLowerCase();
    const excludeSet = new Set(exclude);
    for (const [id, name, tag] of filterInputs) {
      // If the tag isn't hit by a match, no need to check exclusion
      if (!(id.includes(normalizedMatch) || name.includes(normalizedMatch))) {
        continue;
      }
      // If the tag is explicitly excluded, skip it from the result set
      if (excludeSet.has(id) || excludeSet.has(name)) {
        continue;
      }
      // If visibility is specified and does not match, skip it from the result set
      if (visibility !== TAG_VISILBILITY_OPTIONS.ANY && tag.sys.visibility !== visibility) {
        continue;
      }
      // No eliminations, add to results
      tagsResult.push(tag);
    }
    return tagsResult;
  };
}

export { createTagsFilter, TAG_VISILBILITY_OPTIONS };
