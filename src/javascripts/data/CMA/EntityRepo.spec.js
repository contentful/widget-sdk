import { create } from './EntityRepo';

jest.mock('services/PubSubService', () => {});

describe('EntityRepo', () => {
  const spaceEndpoint = jest.fn();
  let repo;

  describe('#update', () => {
    it('calls spaceEndpoint with no headers for default options', () => {
      repo = create(spaceEndpoint, null);
      repo.update({ sys: { type: 'Entry', id: 'id', version: 1 } });
      expect(spaceEndpoint).toBeCalled();
      expect(spaceEndpoint.mock.calls[0][1]).toEqual({});
    });

    it('calls spaceEndpoint with headers for specified options', () => {
      repo = create(spaceEndpoint, null, { skipTransformation: true, skipDraftValidation: true });
      repo.update({ sys: { type: 'Entry', id: 'id', version: 1 } });
      expect(spaceEndpoint).toBeCalled();
      expect(spaceEndpoint.mock.calls[0][1]).toEqual({
        'X-Contentful-Skip-Transformation': 'true',
        'X-Contentful-Skip-UI-Draft-Validation': 'true',
      });
    });
  });
});
