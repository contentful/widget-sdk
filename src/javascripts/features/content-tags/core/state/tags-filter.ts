import { TagTypeAny } from '../TagType';

type Tag = {
  name: string;
  sys: {
    id: string;
    tagType: string;
  };
};
type MatchInput = string;
type ExcludeInput = string[];
type TagTypeInput = string;
type TagsFilterOptions = {
  match?: MatchInput;
  exclude?: ExcludeInput;
  tagType?: TagTypeInput;
};
type TagsFilter = (options: TagsFilterOptions) => Tag[];
type FilterInputs = [string, string, Tag][];

function createTagsFilter(tags: Tag[]): TagsFilter {
  const filterInputs: FilterInputs = [];
  for (const tag of tags) {
    filterInputs.push([tag.sys.id.toLowerCase(), tag.name.toLowerCase(), tag]);
  }
  return function (options: TagsFilterOptions) {
    const tagsResult: Tag[] = [];
    const { match = '', exclude = [], tagType = TagTypeAny } = options;
    const normalizedMatch = match.toLowerCase();
    const excludeSet = new Set(exclude);
    for (const [id, name, tag] of filterInputs) {
      // If we filter by type, skip if not matching
      if (tagType !== TagTypeAny && tag.sys.tagType !== tagType) {
        continue;
      }
      // If the tag isn't hit by a match, no need to check exclusion
      if (!(id.includes(normalizedMatch) || name.includes(normalizedMatch))) {
        continue;
      }
      // If the tag is explicitly excluded, skip it from the result set
      if (excludeSet.has(id) || excludeSet.has(name)) {
        continue;
      }
      // No eliminations, add to results
      tagsResult.push(tag);
    }
    return tagsResult;
  };
}

export { createTagsFilter };
