/* jshint expr: true */
const co = require('co');
const _ = require('lodash-node/modern');
const {coit, clone} = require('./support');
const {expect} = require('chai');
const {
  describeGetResource,
  describeCreateResource,
  describeNewResource
} = require('./space_resource');

module.exports = function describeApiKey () {
  describeGetResource('preview_api_key');
  describeCreateResource('preview_api_key');
  describeNewResource('preview_api_key');

  const apiKey = {singular: 'delivery_api_key', slug: 'api_keys'};
  describeGetResource(apiKey);
  describeCreateResource(apiKey);
  describeNewResource(apiKey);

  describe('api key', function () {
    const apiKeyData = Object.freeze({
      sys: Object.freeze({
        type: 'ApiKey',
        id: '11',
        version: 321
      }),
      name: 'api name',
      accessToken: 'old access token'
    });

    beforeEach(co.wrap(function* () {
      this.request.respond(apiKeyData);
      this.apiKey = yield this.space.createDeliveryApiKey(apiKeyData);
      this.request.reset();
    }));

    it('has a name', function () {
      expect(this.apiKey.getName()).to.equal('api name');
    });

    it('can be deleted', function () {
      expect(this.apiKey.canDelete()).to.be.true;
    });

    it('cannot be deleted if data is empty', function () {
      this.apiKey.data = null;
      expect(this.apiKey.canDelete()).to.be.false;
    });

    describe('#save()', function () {
      coit('with id sends PUT request', function* () {
        this.apiKey.data.name = 'a new name';
        const payload = _.omit(clone(this.apiKey.data), 'accessToken');

        this.request.respond(apiKeyData);
        yield this.apiKey.save();
        expect(this.request).to.be.calledWith({
          method: 'PUT',
          url: '/spaces/42/api_keys/11',
          headers: { 'X-Contentful-Version': 321 },
          data: payload
        });
      });

      coit('without id sends POST request', function* () {
        delete this.apiKey.data.sys.id;
        const payload = _.omit(clone(this.apiKey.data), 'accessToken');

        this.request.respond(apiKeyData);
        yield this.apiKey.save();
        expect(this.request).to.be.calledWith({
          method: 'POST',
          url: '/spaces/42/api_keys',
          data: payload
        });
      });

      coit('updates api key data from server');
    });

    coit('#delete()', function* () {
      this.request.respond(null);
      yield this.apiKey.delete();
      expect(this.request).to.be.calledWith({
        method: 'DELETE',
        url: '/spaces/42/api_keys/11'
      });
    });

    describe('#regenerateAccessToken()', function () {
      coit('sends get request', function* () {
        this.request.respond({accessToken: 'new access token'});
        yield this.apiKey.regenerateAccessToken();
        expect(this.request).to.be.calledWith({
          method: 'GET',
          url: '/spaces/42/api_keys/11/regenerate_access_token'
        });
      });

      coit('updates access token', function* () {
        this.request.respond({sys: {version: 2}, accessToken: 'new access token'});
        yield this.apiKey.regenerateAccessToken();
        expect(this.apiKey.data.accessToken).to.equal('new access token');
        expect(this.apiKey.data.sys.version).to.equal(2);
      });

      coit('rejects empty responses', function* () {
        this.request.respond(null);
        yield expect(this.apiKey.regenerateAccessToken())
          .to.be.rejectedWith(/Response not available/);
        expect(this.apiKey.data.accessToken).to.equal('old access token');
      });
    });
  });
};
