import { registerFactory } from 'NgRegistry.es6';
import searchParser from 'searchParser';

registerFactory('search/cachedParser', () => {
  return function createParser() {
    let cachedInput;
    let cachedResult = [];

    return function parse(input) {
      if (input === cachedInput) {
        return cachedResult;
      }

      try {
        cachedResult = searchParser.parse(input);
      } catch (e) {
        cachedResult = [];
      }

      cachedInput = input;
      return cachedResult;
    };
  };
});
