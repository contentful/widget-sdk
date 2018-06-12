angular.module('contentful')
.factory('random', () => {
  var LETTERS = 'abcdefghijklmnopqvwxyzABCDEFGHIJKLMNOPQVWXYZ';
  var NUMS = '0123456789';
  var ALNUM = NUMS + LETTERS;

  return {
    id: function () {
      return letter(1) + alnum(15);
    },
    letter: letter,
    alnum: alnum
  };

  function fromArray (a) {
    return a[_.random(0, a.length - 1)];
  }

  function letter (count) {
    return _.times(count, () => fromArray(LETTERS)).join('');
  }

  function alnum (count) {
    return _.times(count, () => fromArray(ALNUM)).join('');
  }
});
