const co = require('co');
const {expect, coit} = require('./support');
const describeEntry = require('./entry');
const describeAsset = require('./asset');
const describeContentType = require('./content_type');
const describeEditingInterface = require('./editing_interface');
const describeLocale = require('./locale');

module.exports = function spaceInstanceDescription (serverSpaceData) {
  describe('instance', function () {
    let organization;
    beforeEach(co.wrap(function* () {
      organization = {
        sys: {
          id: 'oid'
        }
      };

      this.request.respond(serverSpaceData);
      this.space = yield this.client.createSpace({name: 'myspace'}, 'myorg');
      this.request.reset();
    }));

    /**
       * Entities
       */
    describeEntry();
    describeAsset();
    describeContentType();
    describeEditingInterface();
    describeLocale();

    coit('#delete', function* () {
      this.request.respond(null);
      yield this.space.delete();
      expect(this.request).to.be.calledWith({
        method: 'DELETE',
        url: '/spaces/42'
      });
    });

    coit('#save', function* () {
      this.request.respond(this.space.data);
      yield this.space.save();
      expect(this.request).to.be.calledWith({
        method: 'PUT',
        url: '/spaces/42',
        data: this.space.data
      });
    });

    it('#isOwner(user) is true for creator', function () {
      let creator = {sys: {id: 'creator'}};
      let user = {sys: {id: 'uid'}};
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
