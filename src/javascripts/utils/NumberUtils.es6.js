function formatFloat(value, localize) {
  return localize
    ? toLocaleString(value)
    : value
        .toFixed(2)
        // remove floating point if not necessary
        .replace(/\.(0)*$|0*$/, '');
}

/**
 * Transforms a number into a localized string (en-US)
 * toLocaleString(1000); // "1,000"
 * @param {Number} number
 */
export function toLocaleString(number) {
  return number.toLocaleString('en-US');
}

/**
 * Make numbers more readable by making them abbreviated
 * @param {Number} number Number to be shortened
 * shorten(2500); // "2.5K"
 * shorten(2500000); // "2.5M"
 * shorten(2550); // "2.55K"
 * shorten(150); // 150
 */
const THOUSAND = 1000;
const MILLION = THOUSAND * THOUSAND;
const BILLION = THOUSAND * MILLION;

export function shorten(number) {
  const format = divisor => formatFloat(number / divisor);

  if (number < THOUSAND) {
    return number;
  } else if (number < MILLION) {
    return format(THOUSAND) + 'K';
  } else if (number < BILLION) {
    return format(MILLION) + 'M';
  } else {
    return format(BILLION) + 'B';
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
export function shortenStorageUnit(value, uom) {
  if (value <= 0) {
    return '0 B';
  }

  const units = ['PB', 'TB', 'GB', 'MB', 'KB', 'B'];

  const getBigger = unit => units[units.indexOf(unit) - 1];
  const getSmaller = unit => units[units.indexOf(unit) + 1];
  const isBiggestUnit = unit => units.indexOf(unit) === 0;
  const isSmallestUnit = unit => units.indexOf(unit) === units.length - 1;

  const reduce = (number, unit) => {
    if (number < 0.99 && !isSmallestUnit(unit)) {
      return reduce(number * 1000, getSmaller(unit));
    } else if (number >= 1000 && !isBiggestUnit(unit)) {
      return reduce(number / 1000, getBigger(unit));
    } else {
      return { number, unit };
    }
  };

  const { number, unit } = reduce(value, uom);

  return `${formatFloat(number)} ${unit}`;
}
