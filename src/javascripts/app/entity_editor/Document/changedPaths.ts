import { unionWith, xorWith, flatten, get, isEqual } from 'lodash';
import { Entity, Link } from './types';

type Field = any;
type Metadata = Entity['metadata'];

/**
 * Takes two entities' `entity.fields` and returns all paths that are
 * different i.e. changed, added or deleted.
 */
export function changedEntityFieldPaths(
  fields1: Record<string, Field>,
  fields2: Record<string, Field>
): string[][] {
  const paths = unionWith(getAllFieldPaths(fields1), getAllFieldPaths(fields2), isTheSamePath);
  return paths.reduce((changedPaths: string[][], path) => {
    if (!isEqual(get(fields1, path), get(fields2, path))) {
      changedPaths.push(path);
    }
    return changedPaths;
  }, []);
}

function getAllFieldPaths(fields: Record<string, Field>) {
  return flatten(
    Object.keys(fields).map((fieldKey) =>
      Object.keys(fields[fieldKey]).map((localeKey) => [fieldKey, localeKey])
    )
  );
}

function isTheSamePath(path1: string[], path2: string[]) {
  return path1.join(':') === path2.join(':');
}

/**
 * Takes two entities' `entity.metadata` and returns all paths that are
 * different i.e. changed, added or deleted.
 */
export function changedEntitytagsPaths(
  metadata1: Metadata = { tags: [] },
  metadata2: Metadata = { tags: [] }
): string[][] {
  // Same tags in different order are considered equal
  const hasEqualTags = !xorWith(metadata1.tags, metadata2.tags, isTheSameTag).length;
  // For now the only `metadata` property is `tags`.
  // If we add more properties we'll need to update this function for editing to work.
  return hasEqualTags ? [] : [['tags']];
}

function isTheSameTag(tag1: Link<'Tag'>, tag2: Link<'Tag'>) {
  return tag1.sys.id === tag2.sys.id;
}
