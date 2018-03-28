/**
 * Make numbers more readable by making them abbreviated
 * shorten(2500); // 2.5K
 * shorten(2500000); // 2.5M
 * shorten(2550); // 2.55K
 * shorten(150); // 150
 */
export function shorten (number) {
  const thousand = 1000;
  const million = 1000000;
  const format = (divisor) => {
    return (number / divisor)
      .toFixed(2)
      .toString()
      // remove floating point if not necessary
      .replace(/\.(0)*$|0*$/, '');
  };

  if (number < thousand) {
    return number;
  } else if (number < million) {
    return format(thousand) + 'K';
  } else {
    return format(million) + 'M';
  }
}
