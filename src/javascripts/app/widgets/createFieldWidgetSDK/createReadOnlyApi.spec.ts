import { makeReadOnlyApiError, ReadOnlyApi } from './createReadOnlyApi';

describe('createReadOnlyApi', () => {
  describe('makeReadOnlyApiError', () => {
    it('returns the right exception for ReadOnlyApi.Dialog', () => {
      const error = makeReadOnlyApiError(ReadOnlyApi.Dialog);

      expect(error.code).toEqual(expect.stringContaining('DIALOG'));
    });

    it('returns the right exception for ReadOnlyApi.Navigate', () => {
      const error = makeReadOnlyApiError(ReadOnlyApi.Navigate);

      expect(error.code).toEqual(expect.stringContaining('NAVIGATE'));
    });

    it('returns the right exception for ReadOnlyApi.Entry', () => {
      const error = makeReadOnlyApiError(ReadOnlyApi.Entry);

      expect(error.code).toEqual(expect.stringContaining('ENTRY'));
    });

    it('returns the right exception for ReadOnlyApi.EntryField', () => {
      const error = makeReadOnlyApiError(ReadOnlyApi.EntryField);

      expect(error.code).toEqual(expect.stringContaining('ENTRY'));
    });

    it('returns the right exception for ReadOnlyApi.Space', () => {
      const error = makeReadOnlyApiError(ReadOnlyApi.Space, 'details');

      expect(error.code).toEqual(expect.stringContaining('METHOD'));
      expect(error['details']).toEqual(expect.stringContaining('details'));
    });

    it('returns generic error otherwise', () => {
      const error = makeReadOnlyApiError('anotherApi', 'details');

      expect(error.code).toEqual(expect.stringContaining('GENERIC'));
    });
  });
});
