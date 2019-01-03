import { createIsolatedSystem } from 'test/helpers/system-js';

describe('data/ContentTypeRepo/accessibleCTs.es6', () => {
  let accessibleCTs;
  const accessibleCTsIds = [1, 2, 3];

  beforeEach(function*() {
    this.system = createIsolatedSystem();
    this.system.set('access_control/AccessChecker/index.es6', {
      canPerformActionOnEntryOfType: (_, id) => accessibleCTsIds.indexOf(id) > -1,
      Action: {
        READ: 'read'
      }
    });
    accessibleCTs = yield this.system.import('data/ContentTypeRepo/accessibleCTs.es6');

    accessibleCTs = accessibleCTs.default;
  });

  it('returns list of CTs that the user has READ access to or selected', () => {
    const publishedCTs = {};
    const testData = [
      {
        selectedCtId: 5,
        bareCTs: [ctMock({ id: 1 }), ctMock({ id: 2 })],
        expected: [ctMock({ id: 1 }), ctMock({ id: 2 })]
      },
      {
        selectedCtId: 1,
        bareCTs: [ctMock({ id: 1 }), ctMock({ id: 2 })],
        expected: [ctMock({ id: 1 }), ctMock({ id: 2 })]
      },
      {
        selectedCtId: 5,
        bareCTs: [ctMock({ id: 5 }), ctMock({ id: 1 }), ctMock({ id: 2 })],
        expected: [ctMock({ id: 5 }), ctMock({ id: 1 }), ctMock({ id: 2 })]
      },
      {
        selectedCtId: null,
        bareCTs: [ctMock({ id: 5 }), ctMock({ id: 1 }), ctMock({ id: 2 })],
        expected: [ctMock({ id: 1 }), ctMock({ id: 2 })]
      }
    ];

    testData.forEach(testData => {
      publishedCTs.getAllBare = () => testData.bareCTs;

      expect(accessibleCTs(publishedCTs, testData.selectedCtId)).toEqual(testData.expected);
    });
  });

  function ctMock(ct) {
    return {
      sys: { id: ct.id },
      displayField: ct.displayField,
      fields: ct.fields || [],
      name: ct.name
    };
  }
});
