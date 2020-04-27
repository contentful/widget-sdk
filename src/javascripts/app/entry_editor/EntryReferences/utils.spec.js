import { createSuccessMessage, createErrorMessage } from './utils';

describe('Create Success Message', () => {
  it('should return a success message for just the root to be published successful', () => {
    const selectedEntities = [{ sys: { id: 'root' } }];
    const root = { sys: { id: 'root' } };
    const expected = 'Root was published successfully';
    expect(createSuccessMessage({ selectedEntities, root, entityTitle: 'Root' })).toEqual(expected);
  });

  it('should return a success message for the root and one other reference', () => {
    const selectedEntities = [{ sys: { id: 'root' } }, { sys: { id: 'entity1' } }];
    const root = { sys: { id: 'root' } };
    const expected = 'Root and 1 reference was published successfully';
    expect(createSuccessMessage({ selectedEntities, root, entityTitle: 'Root' })).toEqual(expected);
  });

  it('should return a success message for the root and two other references', () => {
    const selectedEntities = [
      { sys: { id: 'root' } },
      { sys: { id: 'entity1' } },
      { sys: { id: 'entity2' } },
    ];
    const root = { sys: { id: 'root' } };
    const expected = 'Root and 2 references were published successfully';
    expect(createSuccessMessage({ selectedEntities, root, entityTitle: 'Root' })).toEqual(expected);
  });

  it('should return a success message for two other references without root', () => {
    const selectedEntities = [{ sys: { id: 'entity1' } }, { sys: { id: 'entity2' } }];
    const root = { sys: { id: 'root' } };
    const expected = '2 references were published successfully';
    expect(createSuccessMessage({ selectedEntities, root, entityTitle: 'Root' })).toEqual(expected);
  });

  it('should return a success message for two other references without root and the validated action', () => {
    const selectedEntities = [{ sys: { id: 'entity1' } }, { sys: { id: 'entity2' } }];
    const root = { sys: { id: 'root' } };
    const expected = '2 references were validated successfully';
    expect(
      createSuccessMessage({ selectedEntities, root, entityTitle: 'Root', action: 'validated' })
    ).toEqual(expected);
  });
});

describe('Create Error Message', () => {
  it('should return a success message for just the root to be published successful', () => {
    const selectedEntities = [{ sys: { id: 'root' } }];
    const root = { sys: { id: 'root' } };
    const expected = 'We were unable to publish Root';
    expect(
      createErrorMessage({ selectedEntities, root, entityTitle: 'Root', action: 'publish' })
    ).toEqual(expected);
  });

  it('should return a success message for the root and one other reference', () => {
    const selectedEntities = [{ sys: { id: 'root' } }, { sys: { id: 'entity1' } }];
    const root = { sys: { id: 'root' } };
    const expected = 'We were unable to publish Root and 1 reference';
    expect(
      createErrorMessage({ selectedEntities, root, entityTitle: 'Root', action: 'publish' })
    ).toEqual(expected);
  });

  it('should return a success message for the root and two other references', () => {
    const selectedEntities = [
      { sys: { id: 'root' } },
      { sys: { id: 'entity1' } },
      { sys: { id: 'entity2' } },
    ];
    const root = { sys: { id: 'root' } };
    const expected = 'We were unable to publish Root and 2 references';
    expect(
      createErrorMessage({ selectedEntities, root, entityTitle: 'Root', action: 'publish' })
    ).toEqual(expected);
  });
});
