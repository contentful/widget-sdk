export const equalArrays = (arr1: any, arr2: any): boolean => {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
  if (!arr1.length && !arr2.length) return true;
  if (!arr1.length && arr2.length) return false;

  return arr1.reduce((acum, item) => {
    return acum && arr2.includes(item);
  }, true);
};
