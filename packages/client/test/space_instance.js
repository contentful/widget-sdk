const {expect, coit, clone} = require('./support');
const describeEntry = require('./entry');
const describeAsset = require('./asset');
const describeContentType = require('./content_type');
const describeLocale = require('./locale');

module.exports = function spaceInstanceDescription (serverSpaceData) {
  describe('instance', function () {
    beforeEach(function () {
      this.space = this.client.newSpace(clone(serverSpaceData));
    });

    /**
     * Entities
     */
    describeEntry();
    describeAsset();
    describeContentType();
    describeLocale();

    coit('disabled #update, #save and #delete', function () {
      expect(this.space.update).to.throw();
      expect(this.space.save).to.throw();
      expect(this.space.delete).to.throw();
    });

    it('#isOwner(user) is true for creator', function () {
      let creator = {sys: {id: 'creator'}};
      let user = {sys: {id: 'uid'}};
      let organization = {sys: {id: 'oid'}};
      this.space.data.organization = organization;
      organization.sys.createdBy = creator;
      expect(this.space.isOwner(creator)).to.be.true;
      expect(this.space.isOwner(user)).to.be.false;
    });

    describe('#isAdmin(user)', function () {
      it('is true for admin member', function () {
        let user = {sys: {id: 'uid'}};
        let admin = {sys: {id: 'admin'}};
        this.space.data.spaceMembership = {
          admin: true,
          user: admin
        };
        expect(this.space.isAdmin(admin)).to.be.true;
        expect(this.space.isAdmin(user)).to.be.false;
      });

      it('is false for non admin member', function () {
        let user = {sys: {id: 'uid'}};
        this.space.data.spaceMembership = {
          admin: false,
          user: user
        };
        expect(this.space.isAdmin(user)).to.be.false;
      });
    });

    describe('#isHibernated()', function () {
      it('is false without enforcements', function () {
        delete this.space.data.enforcements;
        expect(this.space.isHibernated()).to.be.false;
      });

      it('is true without matching enforcements', function () {
        this.space.data.enforcements = [{reason: 'unknown'}];
        expect(this.space.isHibernated()).to.be.false;
      });

      it('is true with hibernated enforcement', function () {
        this.space.data.enforcements = [{reason: 'hibernated'}];
        expect(this.space.isHibernated()).to.be.true;
      });
    });
  });
};
