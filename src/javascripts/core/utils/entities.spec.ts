import * as entityUtils from './entities';

describe('core/utils/entities', () => {
  describe('indexById', () => {
    it('returns a Record<entity.sys.id, Entity>', () => {
      const entityList = [
        {
          sys: {
            id: 'id1',
          },
        },
        {
          sys: {
            id: 'id2',
          },
        },
      ];

      const indexed = entityUtils.indexById(entityList);

      expect(indexed['id1']).toEqual(entityList[0]);
      expect(indexed['id2']).toEqual(entityList[1]);
    });
  });
});
