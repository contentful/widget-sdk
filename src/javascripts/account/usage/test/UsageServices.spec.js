import * as UsageService from '../UsageService';

describe('Usage API transformations', () => {
  it('Empty usagePerDay should map to an empty usage array', () => {
    const api = {
      usagePerDay: {}
    };
    const res = UsageService.extractValues(api);
    expect(res.usage).toEqual([]);
  });

  it('usagePerDay object should map to a number', () => {
    const api = {
      usagePerDay: {
        foo: 444
      }
    };
    const res = UsageService.extractValues(api);
    expect(res.usage[0]).toEqual(444);
  });

  it('API transformations should work for no metrics', () => {
    const api = {
      items: []
    };

    const apis = [
      { type: 'cma', api },
      { type: 'cda', api },
      { type: 'cpa', api },
      { type: 'gql', api }
    ];

    const res = UsageService.transformApi(apis);

    expect(res).toEqual({
      cma: { items: [] },
      cda: { items: [] },
      cpa: { items: [] },
      gql: { items: [] }
    });
  });

  it('API metrics response should transfrom to accepted shape', () => {
    const api = {
      items: [
        {
          usagePerDay: {
            foo: 100,
            bar: 200
          }
        }
      ]
    };

    const newAPIShape = {
      items: [
        {
          usage: [100, 200],
          usagePerDay: {
            foo: 100,
            bar: 200
          }
        }
      ]
    };

    const apis = [
      { type: 'cma', api },
      { type: 'cda', api },
      { type: 'cpa', api },
      { type: 'gql', api }
    ];

    const res = UsageService.transformApi(apis);

    expect(res).toEqual({
      cma: newAPIShape,
      cda: newAPIShape,
      cpa: newAPIShape,
      gql: newAPIShape
    });
  });

  it('Should tranform org to the accepted shape', () => {
    const org = {
      items: [
        { metric: 'cma', usagePerDay: { foo: 1, bar: 2, baz: 4 } },
        { metric: 'cda', usagePerDay: {} },
        { metric: 'cpa', usagePerDay: { foo: 1 } },
        { metric: 'gql', usagePerDay: { foo: 1, bar: 2 } }
      ]
    };

    const res = UsageService.transformOrg(org);
    expect(res).toEqual([3, 4, 4]);
  });
});
