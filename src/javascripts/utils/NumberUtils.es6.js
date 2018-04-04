function formatFloat (value, localize) {
  return localize
    ? value.toLocaleString('en-US')
    : value.toFixed(2)
      // remove floating point if not necessary
      .replace(/\.(0)*$|0*$/, '');
}

/**
 * Make numbers more readable by making them abbreviated
 * @param {Number} number Number to be shortened
 * shorten(2500); // "2.5K"
 * shorten(2500000); // "2.5M"
 * shorten(2550); // "2.55K"
 * shorten(150); // 150
 */
export function shorten (number) {
  const thousand = 1000;
  const million = 1000000;
  const format = (divisor) => formatFloat((number / divisor));

  if (number < thousand) {
    return number;
  } else if (number < million) {
    return format(thousand) + 'K';
  } else {
    return format(million) + 'M';
  }
}

/**
 * Make a storage unit number more readable by making them smaller
 * shortenStorageUnit(1000, 'GB'); // "1 TB"
 * shortenStorageUnit(0.001, 'TB'); // "1 GB"
 * @param {Number} number
 * @param {String} uom Unit of measure
 * @returns {String}
 */
export function shortenStorageUnit (value, uom) {
  const units = ['PB', 'TB', 'GB', 'MB', 'KB', 'B'];
  const reduce = (number, counter = 0) => {
    if (number <= 0) {
      return {number, counter};
    }

    if (number < 0.99) {
      return reduce(number * 1000, counter + 1);
    } else if (number >= 1000) {
      return reduce(number / 1000, counter - 1);
    } else {
      return {number, counter};
    }
  };
  const {number, counter} = reduce(value);
  const newUOM = units[units.indexOf(uom) + counter];

  return `${formatFloat(number)} ${newUOM}`;
}
