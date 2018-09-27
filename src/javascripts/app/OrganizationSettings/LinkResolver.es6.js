import { get, set } from 'lodash';

/**
 * Replace respirce links with actual included resources form api response payload
 */
export default function ResolveLinks({
  // paths of links to be replaced with included resource.
  // e.g. 'sys.space', 'sys.user'
  paths = [],
  // included resources in response
  includes = {},
  // actual items in the response
  items = []
}) {
  const getFromIncludes = item => {
    const { linkType, id } = item.sys;
    return includes[linkType].find(resource => resource.sys.id === id);
  };

  items.forEach(item => {
    paths.forEach(path => {
      let newValue;
      const obj = get(item, path);
      if (Array.isArray(obj)) {
        newValue = obj.map(prop => getFromIncludes(prop));
      } else {
        newValue = getFromIncludes(obj);
      }
      set(item, path, newValue);
    });
  });
}
