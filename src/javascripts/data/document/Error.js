import { makeSum } from 'sum-types';

/**
 * This module exports error constructors emitted by the
 * `status.error$` stream of a document.
 * @type {{
 *  Disconnected: ErrorConstructor,
 *  OpenForbidden: ErrorConstructor,
 *  SetValueForbidden: ErrorConstructor,
 *  VersionMismatch: ErrorConstructor,
 *  ShareJsInternalServerError: ErrorConstructor,
 *  CmaInternalServerError: ErrorConstructor,
 * }}
 */
export const Error = makeSum({
  Disconnected: [],
  // Opening a document fails with 'forbidden'
  OpenForbidden: [],
  // `doc.set(path)` responds with a 'forbidden' error.
  SetValueForbidden: ['path'],
  VersionMismatch: [],
  ShareJsInternalServerError: ['error'],
  CmaInternalServerError: ['error'],
});
