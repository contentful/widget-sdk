import * as K from 'helpers/mocks/kefir';

describe('ContactSales', function () {
  beforeEach(function () {
    module('contentful/test', $provide => {
      $provide.value('utils/kefir', {
        getValue: () => [this.user, this.org]
      });
      $provide.value('data/User/index', {
        getCurrentOrgAndSpaceStream: K.createMockProperty(null)
      });
    });
    this.createContactLink = this.$inject('services/ContactSales').createContactLink;
  });

  describe('#createContactLink', function () {
    it('returns a link with query parameters of user details', function () {
      this.user = {
        firstName: 'some name'
      };
      const link = this.createContactLink();
      expect(link).toContain(encodeURIComponent(this.user.firstName));
    });

    it('returns a link with query parameters with company\'s name', function () {
      this.user = {
        firstName: 'some name'
      };
      this.org = {
        name: 'My organization'
      };
      const link = this.createContactLink();
      expect(link).toContain(encodeURIComponent(this.org.name));
    });

    it('returns a link with source in query parameters', function () {
      this.user = {
        firstName: 'some name'
      };
      const source = 'ourcustomsource';
      const link = this.createContactLink(source);
      expect(link).toContain(encodeURIComponent(source));
    });
  });
});
