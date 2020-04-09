import { uniqBy, flatten, keys, get, isEqual } from 'lodash';
/**
 * Takes two entities' `entity.fields` and returns all paths that are
 * different i.e. changed, added or deleted.
 */
export default function changedEntityFieldPaths(fields1, fields2) {
  const paths = uniqBy([...getAllPaths(fields1), ...getAllPaths(fields2)], (path) =>
    path.join(':')
  );
  return paths.reduce((acc, path) => {
    if (!isEqual(get(fields1, path), get(fields2, path))) {
      acc.push(path);
    }
    return acc;
  }, []);
}
function getAllPaths(fields) {
  return flatten(
    keys(fields).map((fieldKey) => keys(fields[fieldKey]).map((localeKey) => [fieldKey, localeKey]))
  );
}
