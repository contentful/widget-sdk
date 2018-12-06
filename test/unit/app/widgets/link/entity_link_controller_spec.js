import _ from 'lodash';

describe('EntityLinkController', () => {
  beforeEach(function() {
    module('contentful/test');
    const $rootScope = this.$inject('$rootScope');
    const $controller = this.$inject('$controller');

    this.helpers = _.transform(
      [
        'entityTitle',
        'entityStatus',
        'entityDescription',
        'entryImage',
        'assetFile',
        'assetFileUrl'
      ],
      (acc, method) => {
        acc[method] = sinon.stub().resolves();
      },
      {}
    );

    this.init = function(scopeProps) {
      const defaultScope = _.extend($rootScope.$new(), { entityHelpers: this.helpers });
      this.scope = _.extend(defaultScope, scopeProps || {});
      this.controller = $controller('EntityLinkController', { $scope: this.scope });
      this.$apply();
    };
  });

  describe('entity missing state', () => {
    const id = 'testid';
    const entity = { sys: { id: id, type: 'Entry' } };

    it('is missing if neither entity nor link is provided', function() {
      this.init();
      expect(this.scope.missing).toBe(true);
    });

    it('is not missing if some entity is provided', function() {
      this.init({ entity: entity });
      expect(this.scope.missing).toBeUndefined();
    });

    it('is missing if only link is provided', function() {
      this.init({ link: { sys: { id: id } } });
      expect(this.scope.missing).toBe(true);
    });
  });

  describe('getting entity info', () => {
    const entry = { sys: { id: 'entryid', type: 'Entry' } };
    const asset = { sys: { id: 'assetid', type: 'Asset' } };
    const url = 'http://some.image.host/pika.gif';
    const file = {};

    it('always gets basic entity info', function() {
      this.helpers.entityTitle.resolves('boo!');
      this.helpers.entityStatus.resolves('published');
      this.init({ entity: entry });
      expect(this.scope.title).toBe('boo!');

      this.helpers.entityTitle.resolves('pow!');
      this.init({ entity: asset });
      expect(this.scope.title).toBe('pow!');
    });

    it('does not get asset details if an entry is provided', function() {
      this.init({ entity: entry });
      sinon.assert.notCalled(this.helpers.assetFile);
      sinon.assert.notCalled(this.helpers.assetFileUrl);
    });

    it('does not get entry details if an asset is provided', function() {
      this.init({ entity: asset });
      sinon.assert.notCalled(this.helpers.entityDescription);
      sinon.assert.notCalled(this.helpers.entryImage);
    });

    it('gets entry details if an entry is provided and details are enabled', function() {
      this.helpers.entityDescription.resolves('some description');
      this.helpers.entryImage.resolves(url);
      this.init({ entity: entry, config: { showDetails: true } });
      expect(this.scope.description).toBe('some description');
      expect(this.scope.image).toBe(url);
    });

    it('gets asset details if an asset is provided', function() {
      this.helpers.assetFile.resolves(file);
      this.helpers.assetFileUrl.resolves(url);
      this.init({ entity: asset });
      expect(this.scope.file).toBe(file);
      expect(this.scope.downloadUrl).toBe(url);
    });
  });

  it('exposes content type when it is loaded', function() {
    const $q = this.$inject('$q');

    const contentType = $q.resolve({ data: { name: 'CTNAME' } });
    this.init({ contentType });
    this.$apply();
    expect(this.scope.contentTypeName).toBe('CTNAME');
  });
});
