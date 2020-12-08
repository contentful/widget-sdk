export const equalArrays = (arr1, arr2) => {
  return arr1?.reduce((acum, item) => {
    return acum && arr2.includes(item);
  }, true);
};
