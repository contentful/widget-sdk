const THOUSAND = 1000;
const MILLION = THOUSAND * THOUSAND;
const BILLION = THOUSAND * MILLION;

export default (number, decimals = 0) => {
  const decimalFactor = Math.pow(10, decimals);
  if (number >= BILLION) {
    return `${Math.round((number / BILLION) * decimalFactor) / decimalFactor}B`;
  }
  if (number >= MILLION) {
    return `${Math.round((number / MILLION) * decimalFactor) / decimalFactor}M`;
  }
  if (number >= THOUSAND) {
    return `${Math.round((number / THOUSAND) * decimalFactor) / decimalFactor}T`;
  }
  return String(number);
};
