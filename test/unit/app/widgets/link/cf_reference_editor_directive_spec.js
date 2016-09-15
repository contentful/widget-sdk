'use strict';

describe('cfReferenceEditorDirective', function () {

  const template = '<cf-reference-editor type="{{ type }}" variant="{{ variant }}" single="single" />';

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeDirectives('cfEntityLink', 'cfAssetCard');
    });

    this.widgetApi = this.$inject('mocks/widgetApi').create();
    this.field = this.widgetApi.field;

    this.$q = this.$inject('$q');
    this.modalDialog = this.$inject('modalDialog');

    this.notifyChange = function () {
      const notifyFn = this.field.onValueChanged.firstCall.args[0];
      notifyFn(this.field.getValue());
      this.$apply();
    };

    this.init = function (scopeProps) {
      return this.$compile(template, scopeProps || {}, {
        cfWidgetApi: this.widgetApi
      }).isolateScope();
    };
  });

  describe('widget settings', function () {
    it('is not draggable for single references', function () {
      const scope = this.init({single: true});
      expect(scope.config.draggable).toBe(false);
    });

    it('is draggable for multiple references', function () {
      const scope = this.init({single: false});
      expect(scope.config.draggable).toBe(true);
    });

    it('shows details for entry cards', function () {
      const scope = this.init({type: 'Entry', variant: 'card'});
      expect(scope.config.showDetails).toBe(true);
    });

    it('does not show details for links', function () {
      const scope = this.init({type: 'Entry', variant: 'link'});
      expect(scope.config.showDetails).toBe(false);
    });

    it('shows images as thumbs for multiple asset cards', function () {
      const scope = this.init({type: 'Asset', variant: 'card', single: false});
      expect(scope.config.asThumb).toBe(true);
    });

    it('checks if uses the asset card variant', function () {
      const scope = this.init({type: 'Asset', variant: 'card'});
      expect(scope.isAssetCard).toBe(true);
    });

    it('determines plural name of entity type', function () {
      expect(this.init({type: 'Entry'}).typePlural).toBe('entries');
      expect(this.init({type: 'Asset'}).typePlural).toBe('assets');
    });
  });

  describe('syncing widget and field values', function () {
    const link1 = {sys: {type: 'Link', linkType: 'Entry', id: 'testid1'}};
    const link2 = {sys: {type: 'Link', linkType: 'Entry', id: 'testid2'}};

    beforeEach(function () {
      this.scope = this.init({type: 'Entry'});
    });

    describe('on field value change', function () {
      it('defaults to an empty array for no field value', function () {
        this.field.getValue.returns(null);
        this.notifyChange();
        expect(this.scope.links).toEqual([]);
      });

      it('wraps and puts single links into their own arrays', function () {
        this.field.getValue.returns(link1);
        this.notifyChange();
        expect(this.scope.links.length).toBe(1);
        expect(this.scope.links[0].link).toBe(link1);
      });

      it('wraps every link in array values', function () {
        this.field.getValue.returns([link1, link2]);
        this.notifyChange();
        expect(this.scope.links.length).toBe(2);
        expect(this.scope.links[0].link).toBe(link1);
        expect(this.scope.links[1].link).toBe(link2);
      });

      it('prefetches linked entities', function () {
        const prefetchSpy = sinon.spy(this.scope.store, 'prefetch');
        this.field.getValue.returns(link1);
        this.notifyChange();
        sinon.assert.calledOnce(prefetchSpy.withArgs([link1]));
      });
    });

    describe('on widget state changes', function () {
      beforeEach(function () {
        this.scope.links = [{link: link1}, {link: link2}];
      });

      it('sets field value when list is rearranged', function () {
        this.scope.uiSortable.update();
        this.$inject('$timeout').flush();
        sinon.assert.calledOnce(this.field.setValue.withArgs([link1, link2]));
      });

      it('sets field value when entity is being selected', function () {
        const entity = {sys: {type: 'Entry', id: 'testid2'}};
        this.$inject('entitySelector').open = sinon.stub().resolves([entity]);
        this.scope.addExisting({preventDefault: _.noop});
        this.$apply();
        expect(this.field.setValue.firstCall.args[0]).toEqual([link1, link2, link2]);
      });

      it('sets field value when link is being removed', function () {
        this.scope.actions.removeFromList(link1);
        sinon.assert.calledOnce(this.field.setValue.withArgs([link2]));
      });
    });
  });

  describe('creating entity', function () {
    const createdEntity = {};

    beforeEach(function () {
      this.create = this.$inject('cfReferenceEditor/createEntity');
      this.space = this.widgetApi.space;
    });

    pit('creates an asset', function () {
      this.space.createAsset.resolves(createdEntity);

      return this.create('Asset', {}, this.space)
      .then(function (entity) {
        expect(entity).toBe(createdEntity);
        sinon.assert.calledOnce(this.space.createAsset.withArgs({}));
      }.bind(this));
    });

    describe('creating an entry', function () {
      const ct1 = {sys: {id: 'ctid', publishedVersion: 123}};
      const ct2 = {sys: {id: 'ctid2', publishedVersion: 666}};

      pit('creates an entry if there is only one CT', function () {
        this.space.createEntry.resolves(createdEntity);
        this.space.getContentTypes.resolves({items: [ct1]});

        return this.create('Entry', {}, this.space)
        .then(function (entity) {
          expect(entity).toBe(createdEntity);
          sinon.assert.calledOnce(this.space.createEntry.withArgs('ctid', {}));
        }.bind(this));
      });

      pit('filters out content types to adhere to single link field validation', function () {
        this.space.getContentTypes.resolves({items: [ct1, ct2]});
        const field = {validations: [{linkContentType: ['ctid']}]};

        return this.create('Entry', field, this.space)
        .then(function () {
          sinon.assert.calledOnce(this.space.createEntry.withArgs('ctid', {}));
        }.bind(this));
      });

      pit('filters out content types to adhere to multiple link field validation', function () {
        this.space.getContentTypes.resolves({items: [ct1, ct2]});
        const field = {itemValidations: [{linkContentType: ['ctid2']}]};

        return this.create('Entry', field, this.space)
        .then(function () {
          sinon.assert.calledOnce(this.space.createEntry.withArgs('ctid2', {}));
        }.bind(this));
      });

      pit('allows user to choose which CT should be used', function () {
        this.space.createEntry.resolves(createdEntity);
        this.space.getContentTypes.resolves({items: [ct1, ct2]});

        this.modalDialog.open = (config) => {
          expect(config.scopeData.cts).toEqual([ct1, ct2]);
          return {promise: this.$q.resolve(ct1)};
        };

        return this.create('Entry', {}, this.space)
        .then(function (entity) {
          expect(entity).toBe(createdEntity);
          sinon.assert.calledOnce(this.space.createEntry.withArgs('ctid', {}));
        }.bind(this));
      });
    });

    it('adds link and redirects to entity editor after creation', function () {
      const id = 'assetid';
      const asset = {sys: {id, type: 'Asset'}};

      this.field.getValue.returns([]);
      this.space.createAsset.resolves(asset);

      const scope = this.init({type: 'Asset'});
      this.notifyChange();
      scope.addNew({preventDefault: _.noop});
      this.$apply();

      expect(scope.links.length).toBe(1);
      expect(scope.links[0].link.sys.id).toBe(id);
      sinon.assert.calledOnce(this.widgetApi.state.goToEditor.withArgs(asset));
    });
  });

  describe('publication warning - unpublished references', function () {
    const published = {sys: {publishedVersion: 1}};
    const unpublished = {sys: {publishedVersion: null}};
    const validWarning = {count: 1, linked: 'Entry'};

    beforeEach(function () {
      this.scope = this.init({type: 'Entry'});
      this.scope.links = [{link: {}}, {link: {}}];
      this.get = this.scope.store.get = sinon.stub();

      sinon.assert.calledOnce(this.widgetApi.field.registerPublicationWarning);
      this.warning = this.widgetApi.field.registerPublicationWarning.firstCall.args[0];
    });

    it('registers publication warning', function () {
      expect(this.warning.group).toBe('reference_widget_unpublished_references');
      expect([
        typeof this.warning.shouldShow,
        typeof this.warning.warnFn,
        typeof this.warning.getData
      ]).toEqual(['function', 'function', 'function']);
    });

    it('should be shown if there are unpublished references', function () {
      this.get.onCall(0).returns(published).onCall(1).returns(published);
      expect(this.warning.shouldShow()).toBe(false);

      this.get.onCall(2).returns(published).onCall(3).returns(unpublished);
      expect(this.warning.shouldShow()).toBe(true);
    });

    it('should prepare warning data', function () {
      this.widgetApi.field.name = 'test';
      this.widgetApi.field.locale = 'en-US';
      this.get.onCall(0).returns(unpublished).onCall(1).returns(unpublished);

      const data = this.warning.getData();
      expect(data.fieldName).toBe('test (en-US)');
      expect(data.count).toBe(2);
      expect(data.linked).toBe('Entry');
      expect(data.type).toBe('entries');
    });

    it('displays only the valid warnings', function () {
      this.modalDialog.open = (config) => {
        expect(config.scopeData.unpublishedRefs).toEqual([validWarning]);
        expect(config.scopeData.linkedEntityTypes).toBe('entries');
        return {promise: this.$q.resolve()};
      };

      this.warning.warnFn([null, {count: 0}, validWarning]);
    });

    it('computes title based on liked entity types', function () {
      const assetWarning = {count: 1, linked: 'Asset'};

      this.modalDialog.open = (config) => {
        if (config.scopeData.unpublishedRefs.length === 2) {
          expect(config.scopeData.linkedEntityTypes).toBe('entries and assets');
        } else {
          expect(config.scopeData.linkedEntityTypes).toBe('assets');
        }

        return {promise: this.$q.resolve()};
      };

      this.warning.warnFn([validWarning, assetWarning]);
      this.warning.warnFn([assetWarning]);
    });
  });
});
