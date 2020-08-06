import { createAccessApi } from './createAccessApi';
import makeExtensionAccessHandlers from 'widgets/bridges/makeExtensionAccessHandlers';
jest.mock('widgets/bridges/makeExtensionAccessHandlers');

describe('createAccessApi', () => {
  describe('can', () => {
    describe('when allowed', () => {
      it('resolves to true', async () => {
        const canAccess = jest.fn(() => true);
        makeExtensionAccessHandlers.mockReturnValueOnce(canAccess);
        const accessApi = createAccessApi();
        const result = await accessApi.can('do something', 'to this');
        expect(result).toEqual(true);
      });
    });
    describe('when not allowed', () => {
      it('resolves to false', async () => {
        const canAccess = jest.fn(() => false);
        makeExtensionAccessHandlers.mockReturnValueOnce(canAccess);
        const accessApi = createAccessApi();
        const result = await accessApi.can('do something', 'to this');
        expect(result).toEqual(false);
      });
    });
  });
});
