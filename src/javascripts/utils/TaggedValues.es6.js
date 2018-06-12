import {find} from 'lodash';
import {shallowFreeze} from 'utils/Freeze';

/**
 * This module provides functions for dealing with tagged values, also
 * known as sum types.
 *
 *     import {makeCtor, match} from 'utils/TaggedValues'
 *
 *     const Success = makeCtor();
 *     const Failure = makeCtor();
 *
 *     function getValue (result) {
 *       return match(result, {
 *         [Success]: (value) => value
 *         [Failure]: (_error) => null
 *       });
 *     }
 *
 *     getValue(Success('Hello')) // => 'Hello'
 *     getValue(Failure('Oops')) // => null
 *
 *
 * Named tags. Helpful for debugging
 *
 *     const MyTag = makeCtor('MyTag')
 *     const myValue = MyTag('Hi')
 *     // myValue = { tag: '...', name: 'MyTag', value: 'Hi' }
 *
 *
 * Constructor functions
 *
 *     const Number = makeCtor((value) => {
 *       if (typeof value !== 'number') {
 *         throw new TypeError('Expected number')
 *       }
 *       return number + 1;
 *     })
 *     Number('') // => throws TypeError
 *     Number(5).value // => 6
 *
 *
 * Tagged values are shallow frozen
 *
 *     const MyTag = makeCtor()
 *     const tagged = MyTag({flag: true})
 *     tagged.value.flag = false
 *     tagged.value = {} // => throws error
 *
 *
 * Default case in match
 *
 *     const MyTag = makeCtor()
 *     match(MyTag('VALUE'), {
 *       _: (taggedValue) => { console.log(taggedValue) }
 *     })
 *     // logs { tag: MyTag.tag, value: 'VALUE' }
 *
 *
 * Higher-order matchers. The following are equivalent
 *
 *     function getValue (result, ...args) {
 *       return match(result, {
 *         [Success]: (value) => [true, value, ...args]
 *         [Failure]: (error) => [false, error, ...args]
 *       });
 *     }
 *
 *     const getValue = makeMatcher({
 *       [Success]: (value, ...args) => [true, value, ...args]
 *       [Failure]: (error, ...args) => [false, error, ...args]
 *     })
 *
 */


// Whenever we create a constructor we want it to use a unique tag.
let nextTag = 0;


/**
 * Create a constructor function for a new tagged value.
 *
 * The tagged value constructor accepts exactly one argument which is
 * available in matchers.
 *
 * Values returned by constructor are shallow frozen.
 *
 * If the `name` parameter is provided all tagged values created with
 * this constructor carry the same `name` property. This is helpful for
 * debugging and is used in the error message for unhandled cases in
 * `match()`.
 *
 * If the `fn` value is given the argument to the constructor is
 * transformed through that function.
 */
export function makeCtor (name, fn) {
  if (typeof name === 'function') {
    fn = name;
    name = null;
  }

  const tag = `${nextTag}`;
  nextTag += 1;


  function ctor (value) {
    const obj = {tag};
    if (fn) {
      obj.value = fn(value);
    } else {
      obj.value = value;
    }

    if (name) {
      obj.name = name;
    }

    return shallowFreeze(obj);
  }

  ctor.tag = tag;
  ctor.toString = () => tag;

  return ctor;
}


export function isTag (value, ctor) {
  return value.tag === ctor.toString();
}


export function match (tagged, handlers, ...args) {
  const handler = find(handlers, (_, tag) => {
    return tag === tagged.tag;
  });

  if (handler) {
    return handler(tagged.value, ...args);
  } else if (handlers._) {
    return handlers._(tagged, ...args);
  } else {
    throw new TypeError(`Unhandled tag ${tagged.name || tagged.tag}`);
  }
}


export function makeMatcher (handlers) {
  return (tagged, ...args) => match(tagged, handlers, ...args);
}
