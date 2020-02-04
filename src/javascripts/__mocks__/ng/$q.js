export const resolve = jest.fn().mockImplementation(value => Promise.resolve(value));
export const reject = jest.fn().mockImplementation(error => Promise.reject(error));
export const all = jest.fn().mockImplementation(queries => Promise.all(queries));
export const denodeify = jest.fn().mockImplementation(fn => fn(function callback() {}));
export const defer = jest.fn().mockImplementation(() => {
  let resolve, reject;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve,
    reject
  };
});

export default {
  resolve,
  reject,
  all,
  denodeify
};
