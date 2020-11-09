import { create } from './EntityRepo';

describe('EntityRepo', () => {
  const entityFromSpaceEndpoint = { foo: 'bar' };
  const spaceEndpoint = jest.fn().mockReturnValue(entityFromSpaceEndpoint);
  const triggerCmaAutoSave = jest.fn();
  let repo;

  describe('#get', () => {
    it('calls spaceEndpoint with headers specific to GET request', async () => {
      repo = create(spaceEndpoint, null, triggerCmaAutoSave, {
        skipTransformation: true,
        skipDraftValidation: true,
        indicateAutoSave: true,
      });
      expect(spaceEndpoint).not.toHaveBeenCalled();
      const result = await repo.get('Entry', 'id');
      expect(result).toBe(entityFromSpaceEndpoint);
      expect(spaceEndpoint).toHaveBeenCalledTimes(1);
      expect(spaceEndpoint.mock.calls[0][1]).toEqual({
        'X-Contentful-Skip-Transformation': 'true',
      });
    });

    it('does not trigger the auto_save webhook', async () => {
      repo = create(spaceEndpoint, null, triggerCmaAutoSave);
      await repo.get('Entry', 'id');
      expect(triggerCmaAutoSave).not.toHaveBeenCalled();
    });
  });

  describe('#update', () => {
    it('calls spaceEndpoint with no headers for default options', async () => {
      repo = create(spaceEndpoint, null, triggerCmaAutoSave);
      expect(spaceEndpoint).not.toHaveBeenCalled();
      const result = await repo.update({ sys: { type: 'Entry', id: 'id', version: 1 } });
      expect(result).toBe(entityFromSpaceEndpoint);
      expect(spaceEndpoint).toHaveBeenCalledTimes(1);
      expect(spaceEndpoint.mock.calls[0][1]).toEqual({});
    });

    it('calls spaceEndpoint with headers for specified options', async () => {
      repo = create(spaceEndpoint, null, triggerCmaAutoSave, {
        skipTransformation: true,
        skipDraftValidation: true,
        indicateAutoSave: true,
      });
      expect(spaceEndpoint).not.toHaveBeenCalled();
      const result = await repo.update({ sys: { type: 'Entry', id: 'id', version: 1 } });
      expect(result).toBe(entityFromSpaceEndpoint);
      expect(spaceEndpoint).toHaveBeenCalledTimes(1);
      expect(spaceEndpoint.mock.calls[0][1]).toEqual({
        'X-Contentful-Skip-Transformation': 'true',
        'X-Contentful-Skip-UI-Draft-Validation': 'true',
        'X-Contentful-UI-Content-Auto-Save': 'true',
      });
    });

    it('triggers the auto_save webhook', async () => {
      repo = create(spaceEndpoint, null, triggerCmaAutoSave, {
        skipTransformation: true,
        skipDraftValidation: true,
        indicateAutoSave: true,
      });
      expect(triggerCmaAutoSave).not.toHaveBeenCalled();
      await repo.update({ sys: { type: 'Entry' } });
      expect(triggerCmaAutoSave).toHaveBeenCalledTimes(1);
    });
  });
});
