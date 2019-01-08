export const replaceVariablesInUrl = jest.fn();
export const getForContentType = jest.fn();
export const getSelected = jest.fn();

export const getInvalidFields = jest.fn().mockImplementation(() => ({
  nonExistentFields: [],
  invalidTypeFields: []
}));

export const create = jest.fn();
export const update = jest.fn();
export const remove = jest.fn();

export const urlFormatIsValid = jest.fn().mockImplementation(() => true);

export default {
  getInvalidFields,
  create,
  update,
  remove,
  urlFormatIsValid,
  replaceVariablesInUrl,
  getForContentType,
  getSelected
};
