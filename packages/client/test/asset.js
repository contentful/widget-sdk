/* jshint expr: true */
const co = require('co');
const {coit} = require('./support');
const {expect} = require('chai');
const describeEntity = require('./entity');
const describeArchivable = require('./archivable');
const {
  describeResource,
  describeGetResource,
  describeCreateResource,
  describeContentEntity
} = require('./space_resource');

module.exports = function describeAsset () {
  const asset = { singular: 'asset', plural: 'assets' };
  describeGetResource(asset);
  describeCreateResource(asset);
  describeContentEntity(asset, setupEntity);
  describeEntity(asset, setupEntity);
  describeArchivable(asset, setupEntity);

  function setupEntity () {
    beforeEach(co.wrap(function* () {
      this.request.respond({sys: {type: 'Asset'}});
      this.entity = yield this.space.createAsset();
    }));
  }

  describeResource(asset, function () {
    coit('#process()', function* () {
      this.request.respond(null);
      yield this.asset.process('myversion', 'mylocale');
      expect(this.request).to.be.calledWith({
        method: 'PUT',
        url: '/spaces/42/assets/43/files/mylocale/process',
        headers: { 'X-Contentful-Version': 'myversion' }
      });
    });
  });
};
