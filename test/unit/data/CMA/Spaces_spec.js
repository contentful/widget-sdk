import {cloneDeep} from 'lodash';

describe('data/CMA/Spaces', function () {
  beforeEach(function () {
    this.fetch = sinon.stub();
    module('contentful/test', $provide => {
      $provide.value('data/Request', {
        default: () => this.fetch
      });
    });

    this.spaces = this.$inject('data/CMA/Spaces');
  });

  it('gets all user\'s spaces', function* () {
    const result = {
      total: 1,
      items: [{ name: 'example_space', sys: { id: 'example_id' } }]
    };
    this.fetch.resolves({ data: cloneDeep(result) });

    const spaces = yield this.spaces.makeFetchSpacesWithAuth()();
    expect(spaces).toEqual(result);
  });
});
