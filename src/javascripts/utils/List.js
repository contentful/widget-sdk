/**
 * Takes a list of objects and returns a list of {key, value} tuples
 * where 'value' is a reference to the item of the input list and 'key'
 * is a string that is unique in the output list.
 *
 * ~~~js
 * const a = {id: 'a']
 * const b = {id: 'b']
 * const items = [a, b, a]
 * makeKeyed(items, (item) => item.id)
 * // => [
 * // {key: 'a!1', value: a}
 * // {key: 'b!1', value: b}
 * // {key: 'a!2', value: a}
 * // ]
 * ~~~
 *
 * This function is useful for the ngRepeat directive
 * ~~~
 * $scope.list = makeKeyed(items, makeHash)
 * ~~~
 * and in the template
 * ~~~
 * div(ng-repeat="item in list track by item.key")
 *   | {{ item.value }}
 * ~~~
 *
 *
 * The following properties holds:
 * ~~~js
 * // Contains original items in correct order
 * const keyed = makeKeyed(items, makeHash)
 * assert.shallowEqual(
 *   keyed.map((i) => i.value),
 *   items
 * )
 *
 * // Keys are unique
 * assert.uniqueItems(keyed.map((i) => i.key))
 *
 * // Keys are preserved for equal inputs
 * const keyed2 = makeKeyed(items2, makeHash)
 * if (isEqual(items.map(makeHash), items2.map(makeHash)) {
 *   assert.shallowEqual(
 *     keyed.map((i) => i.key),
 *     keyed2.map((i) => i.key)
 *   )
 * }
 *
 * // Same key implies equal value (through hash)
 * if (items[i].key === items2[j].key) {
 *   assert.equal(
 *     makeHash(items[i].value)
 *     makeHash(items2[j].value)
 *   )
 * }
 * ~~~
 *
 * @param {T[]} items
 * @param {function(T): string} getHash
 */
export function makeKeyed(items, getHash) {
  const hashCount = {};
  return items.map(item => {
    const hash = getHash(item);
    hashCount[hash] = (hashCount[hash] || 0) + 1;
    return {
      value: item,
      key: hash + '!' + hashCount[hash]
    };
  });
}
