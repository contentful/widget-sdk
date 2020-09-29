const { getReadableContentTypes } = require('./filter');

jest.mock('access_control/AccessChecker', () => ({
  canPerformActionOnEntryOfType: (_, id) => [1, 2, 3].indexOf(id) > -1,
  Action: {
    READ: 'read',
  },
}));

describe('filter', () => {
  it('returns list of CTs that the user has READ access to or selected', () => {
    const testData = [
      {
        selectedCtId: 5,
        bareCTs: [ctMock({ id: 1 }), ctMock({ id: 2 })],
        expected: [ctMock({ id: 1 }), ctMock({ id: 2 })],
      },
      {
        selectedCtId: 1,
        bareCTs: [ctMock({ id: 1 }), ctMock({ id: 2 })],
        expected: [ctMock({ id: 1 }), ctMock({ id: 2 })],
      },
      {
        selectedCtId: 5,
        bareCTs: [ctMock({ id: 5 }), ctMock({ id: 1 }), ctMock({ id: 2 })],
        expected: [ctMock({ id: 5 }), ctMock({ id: 1 }), ctMock({ id: 2 })],
      },
      {
        selectedCtId: null,
        bareCTs: [ctMock({ id: 5 }), ctMock({ id: 1 }), ctMock({ id: 2 })],
        expected: [ctMock({ id: 1 }), ctMock({ id: 2 })],
      },
    ];

    testData.forEach((testData) => {
      expect(getReadableContentTypes(testData.bareCTs, testData.selectedCtId)).toEqual(
        testData.expected
      );
    });
  });

  function ctMock(ct) {
    return {
      sys: { id: ct.id },
      displayField: ct.displayField,
      fields: ct.fields || [],
      name: ct.name,
    };
  }
});
