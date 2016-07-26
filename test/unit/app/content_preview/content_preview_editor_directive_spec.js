'use strict';

describe('cfContentPreviewEditor directive', function () {

  var spaceContext, contentPreview, notification, $state;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.value('spaceContext', spaceContext);
      $provide.value('accessChecker', {wasForbidden: sinon.stub().returns(false)});
      $provide.value('notification', notification);
    });
    spaceContext = {
      refreshContentTypes: sinon.stub(),
      getFilteredAndSortedContentTypes: sinon.stub()
    };
    notification = {
      info: sinon.stub().returns(),
      warn: sinon.stub().returns()
    };
    contentPreview = this.$inject('contentPreview');
    contentPreview.get = sinon.stub();
    contentPreview.create = sinon.stub();
    contentPreview.update = sinon.stub();
    $state = this.$inject('$state');
    $state.go = sinon.stub().returns();

    this.setup = function (isNew) {
      this.element = this.$compile('<cf-content-preview-editor />', {
        context: {
          isNew: isNew
        }
      });
      this.scope = this.element.scope();
    };
  });

  afterEach(function () {
    spaceContext = contentPreview = notification = null;
  });

  describe('Create new content preview environment', function () {
    beforeEach(function () {
      contentPreview.get.rejects();
      var contentTypes = [{
        getId: _.constant('ct-1'),
        getName: _.constant('Ct - 1'),
        data: {fields: [{apiName: 'field1'}]}
      }];
      contentPreview.create.resolves({sys: {id: 'foo'}});
      spaceContext.refreshContentTypes.resolves();
      spaceContext.getFilteredAndSortedContentTypes.returns(contentTypes);
      this.setup(true);
    });

    it('sets default title', function () {
      expect(this.scope.context.title).toBe('Untitled');
    });

    it('save button is disabled', function () {
      var button = this.element.find('button:contains("Save")');
      expect(button.attr('aria-disabled')).toBe('true');
    });

    it('updates name and description', function () {
      var nameEl = this.element.find('input.content-preview-editor__input');
      var descriptionEl = this.element.find('textarea.content-preview-editor__input');
      nameEl.val('My PE').trigger('input');
      descriptionEl.val('New PE').trigger('input');
      expect(this.scope.previewEnvironment.name).toBe('My PE');
      expect(this.scope.previewEnvironment.description).toBe('New PE');
      expect(this.scope.context.dirty).toBe(true);
    });

    it('generates empty configs from content types', function () {
      var configs = this.scope.previewEnvironment.configs;
      expect(configs.length).toBe(1);
      expect(configs[0].contentType).toBe('ct-1');
      expect(configs[0].name).toBe('Ct - 1');
      expect(configs[0].url).toBe('');
    });

    it('calls Create method and redirects on save', function () {
      this.element.find('input.content-preview-editor__input').val('My PE').trigger('input');
      this.element.find('button:contains("Save")').trigger('click');
      sinon.assert.calledWith(contentPreview.create, this.scope.previewEnvironment);
      sinon.assert.calledWith($state.go, 'spaces.detail.settings.content_preview.detail', {contentPreviewId: 'foo'});
    });

    it('shows notification if create fails', function () {
      contentPreview.create.rejects();
      this.element.find('input.content-preview-editor__input').val('My PE').trigger('input');
      this.element.find('button:contains("Save")').trigger('click');
      sinon.assert.calledWith(contentPreview.create, this.scope.previewEnvironment);
      sinon.assert.calledWith(notification.warn, 'Could not save Preview Environment');
    });

    it('shows error if name is not present on save', function () {
      var descriptionEl = this.element.find('textarea.content-preview-editor__input');
      descriptionEl.val('description').trigger('input');
      this.element.find('button:contains("Save")').trigger('click');
      expect(this.scope.invalidFields.errors.name).toBe('Please provide a name.');
      sinon.assert.notCalled(contentPreview.create);
    });

    it('shows error if a content type is active but no value is provided', function () {
      this.element.find('input.content-preview-editor__input').val('My PE').trigger('input');
      this.element.find('#ct-1').prop('checked', true).trigger('click');
      this.element.find('button:contains("Save")').trigger('click');
      expect(this.scope.invalidFields.errors.configs['ct-1']).toBeTruthy();
      sinon.assert.notCalled(contentPreview.create);
    });

    it('saves but shows warning if a provided field token is invalid', function () {
      this.element.find('input.content-preview-editor__input').val('My PE').trigger('input');
      var configEl = this.element.find('.content-preview-editor__content-type');
      configEl.find('input[type="checkbox"]').prop('checked', true).trigger('click');
      configEl.find('input[type="text"]').val('https://www.test.com/{entry_field.field1}/{entry_field.invalid}').trigger('input');
      this.element.find('button:contains("Save")').trigger('click');
      expect(this.scope.invalidFields.warnings.configs['ct-1']).toBe('Fields with the following IDs don\'t exist in the content type: invalid');
      sinon.assert.calledWith(contentPreview.create, this.scope.previewEnvironment);
    });

    it('shows notification and resets form when saved successfully', function () {
      var descriptionEl = this.element.find('input.content-preview-editor__input');
      descriptionEl.val('name').trigger('input');
      this.element.find('button:contains("Save")').trigger('click');
      sinon.assert.calledOnce(notification.info);
      expect(this.scope.context.dirty).toBe(false);
      expect(this.element.find('button:contains("Save")').attr('aria-disabled')).toBe('true');
    });
  });

  describe('Edit existing content preview environment', function () {
    beforeEach(function () {
      var env = {
        name: 'PE 1',
        description: 'First PE',
        sys: {id: 'pe-1'},
        configurations: [{
          url: 'https://www.test.com',
          contentType: 'foo',
          enabled: true
        }]
      };
      contentPreview.get.resolves(env);
      contentPreview.update.resolves({sys: {id: 'foo'}});

      var contentTypes = [{
        getId: _.constant('foo'),
        getName: _.constant('Foo'),
        data: {fields: [{apiName: 'field1'}]}
      }, {
        getId: _.constant('bar'),
        getName: _.constant('Bar'),
        data: {fields: [{apiName: 'field2'}]}
      }];
      spaceContext.refreshContentTypes.resolves();
      spaceContext.getFilteredAndSortedContentTypes.returns(contentTypes);
      this.setup(false);
    });

    it('populates name and description', function () {
      var name = this.element.find('input.content-preview-editor__input').val();
      var description = this.element.find('textarea.content-preview-editor__input').val();
      expect(name).toBe('PE 1');
      expect(description).toBe('First PE');
    });

    it('displays configuration details', function () {
      var configEl = this.element.find('.content-preview-editor__content-type:first');
      expect(configEl.find('input[type="checkbox"]').prop('checked')).toBe(true);
      var url = 'https://www.test.com';
      expect(configEl.find('input[type="text"]').val()).toBe(url);
    });

    it('adds empty configuration object if none exists for that content type', function () {
      var configEl = this.element.find('.content-preview-editor__content-type:eq(1)');
      expect(configEl.find('input[type="checkbox"]').prop('checked')).toBe(false);
      expect(configEl.find('input[type="text"]').val()).toBe('');
    });

    it('displays success message when saved successfully', function () {
      contentPreview.update.resolves({name: 'New name', sys: {id: 'foo'}});
      this.element.find('input.content-preview-editor__input').val('New name').trigger('input');
      this.element.find('button:contains("Save")').trigger('click');
      sinon.assert.calledWith(notification.info, 'Content preview "New name" saved successfully');
    });

    it('displays error when fails', function () {
      contentPreview.update.rejects();
      this.element.find('input.content-preview-editor__input').val('New name').trigger('input');
      this.element.find('button:contains("Save")').trigger('click');
      sinon.assert.calledWith(notification.warn, 'Could not save Preview Environment');
    });
  });
});
