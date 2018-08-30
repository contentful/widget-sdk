/* global setImmediate */

import _ from 'lodash';

const sel = id => `[data-test-id="${id}"]`;

export const getElement = (wrapper, id) => wrapper.find(sel(id));

export const assertElementExists = (wrapper, id) =>
  expect(wrapper.find(sel(id)).exists()).toEqual(true, id);

export const assertMessageEquals = (text, message, args) =>
  expect(text).toEqual(_.template(message)(args));

export const flushPromises = () =>
  new Promise(resolve => {
    setImmediate(() => {
      resolve();
    });
  });
