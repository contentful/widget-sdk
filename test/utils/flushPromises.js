/**
 * this returns a new promise and is just a simple way to
 * wait until the next tick so resolved promises chains will continue
 *
 * @export
 * @returns Promise
 */
export default function flushPromises() {
  return new Promise(resolve => {
    setImmediate(() => {
      resolve();
    });
  });
}
