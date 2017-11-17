/* jshint expr: true */
const co = require('co');
const {coit, clone} = require('./support');
const {expect} = require('chai');
const {
  describeGetResource,
  describeCreateResource,
  describeNewResource
} = require('./space_resource');

module.exports = function describeLocale () {
  const locale = { singular: 'locale', plural: 'locales' };
  describeGetResource(locale);
  describeCreateResource(locale);
  describeNewResource(locale);

  describe('locale', function () {
    const localeData = Object.freeze({
      code: 'en-US',
      name: 'U.S. English',
      contentManagementApi: true,
      contentDeliveryApi: true,
      sys: Object.freeze({
        id: '11',
        version: 321
      })
    });

    beforeEach(co.wrap(function* () {
      this.request.respond(localeData);
      this.locale = yield this.space.createLocale(localeData);
      this.request.reset();
    }));

    it('has a name', function () {
      expect(this.locale.getName()).to.equal('U.S. English');
    });

    it('can be deleted', function () {
      expect(this.locale.canDelete()).to.be.true;
    });

    it('cannot be deleted if the data is empty', function () {
      this.locale.data = null;
      expect(this.locale.canDelete()).to.be.false;
    });

    describe('#save()', function () {
      coit('with id sends PUT request', function* () {
        this.locale.data.name = 'German';
        this.locale.data.code = 'de-DE';

        const payload = clone(this.locale.data);

        this.request.respond(localeData);
        yield this.locale.save();
        expect(this.request).to.be.calledWith({
          method: 'PUT',
          url: '/spaces/42/locales/11',
          headers: { 'X-Contentful-Version': 321 },
          data: payload
        });
      });

      coit('without id sends POST request', function* () {
        delete this.locale.data.sys.id;
        const payload = clone(this.locale.data);

        this.request.respond(localeData);
        yield this.locale.save();
        expect(this.request).to.be.calledWith({
          method: 'POST',
          url: '/spaces/42/locales',
          data: payload
        });
      });
    });

    coit('#delete()', function* () {
      this.request.respond(null);
      yield this.locale.delete();
      expect(this.request).to.be.calledWith({
        method: 'DELETE',
        url: '/spaces/42/locales/11'
      });
    });
  });
};
