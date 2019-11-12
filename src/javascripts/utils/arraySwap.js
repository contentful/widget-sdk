const arraySwapMutate = (array, from, to) => {
  array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
};

const arraySwap = (array, from, to) => {
  array = array.slice();
  arraySwapMutate(array, from, to);
  return array;
};

export default arraySwap;
