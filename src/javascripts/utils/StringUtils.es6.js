export function joinWithAnd(items, oxford = true) {
  if (!Array.isArray(items)) {
    return null;
  }

  return items.reduce((memo, item, i) => {
    if (i === 0) {
      return item;
    } else if (i === items.length - 1) {
      return `${memo}${oxford ? ',' : ''} and ${item}`;
    } else {
      return `${memo}, ${item}`;
    }
  }, '');
}
