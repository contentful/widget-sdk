export function joinWithAnd (items, oxford = true) {
  if (!Array.isArray(items)) {
    return null;
  }

  let sentence = '';

  if (items.length <= 1) {
    sentence = items[0];
  } else {
    sentence = items.reduce((memo, item, i) => {
      if (i === items.length - 1) {
        return `${memo}${oxford ? ',' : ''} and ${item}`;
      } else if (i !== 0) {
        return `${memo}, ${item}`;
      } else {
        return item;
      }
    }, '');
  }

  return sentence;
}
