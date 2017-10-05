import {cloneDeep} from 'lodash';

describe('data/CMA/Spaces', function () {
  beforeEach(function () {
    module('contentful/test');

    this.fetch = sinon.stub();
    this.$inject('data/Request').default = () => this.fetch;
    this.spaces = this.$inject('data/CMA/Spaces');
  });

  it('downloads all user\'s spaces', function* () {
    const result = {
      total: 1,
      items: [{ name: 'example_space', sys: { id: 'example_id' } }]
    };
    this.fetch.resolves({ data: cloneDeep(result) });

    const spaces = yield this.spaces.makeFetchSpacesWithAuth()();
    expect(spaces).toEqual(result);
  });
});
