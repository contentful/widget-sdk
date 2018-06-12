import {setCheckbox} from 'helpers/DOM';
import * as sinon from 'helpers/sinon';

describe('cfContentPreviewEditor directive', () => {
  let spaceContext, contentPreview, notification, $state;

  beforeEach(function () {
    notification = {
      info: sinon.stub().returns(),
      warn: sinon.stub().returns()
    };
    module('contentful/test', $provide => {
      $provide.value('access_control/AccessChecker', {wasForbidden: sinon.stub().returns(false)});
      $provide.value('notification', notification);
    });
    spaceContext = this.$inject('mocks/spaceContext').init();
    spaceContext.getId = _.constant('sid');
    contentPreview = this.$inject('contentPreview');
    contentPreview.get = sinon.stub();
    contentPreview.create = sinon.stub();
    contentPreview.update = sinon.stub();
    contentPreview.canCreate = sinon.stub();
    contentPreview.canCreate.resolves(true);
    $state = this.$inject('$state');
    $state.go = sinon.stub().returns();

    this.setup = function () {
      this.element = this.$compile('<cf-content-preview-editor />', {
        context: {
          isNew: this.isNew
        }
      });
      this.scope = this.element.scope();

      this.elements = {
        name: this.element.find('input.content-preview-editor__input'),
        description: this.element.find('textarea.content-preview-editor__input'),
        save: this.element.find('button:contains("Save")'),
        delete: this.element.find('button:contains("Delete")'),
        firstConfig: this.element.find('.content-preview-editor__content-type:first'),
        secondConfig: this.element.find('.content-preview-editor__content-type:eq(1)')
      };

      this.updateName = function (value) {
        this.elements.name.val(value).trigger('input');
      };

      this.updateDescription = function (value) {
        this.elements.description.val(value).trigger('input');
      };

      this.clickSave = function () {
        this.elements.save.trigger('click');
      };

      this.setFirstConfig = function (value) {
        this.elements.firstConfig.find('input[type="checkbox"]')
        .prop('checked', true).trigger('click');
        this.elements.firstConfig.find('input[type="text"]')
        .val(value).trigger('input');
      };
    };
  });

  afterEach(() => {
    spaceContext = contentPreview = notification = $state = null;
  });

  describe('Create new content preview environment', () => {
    beforeEach(function () {
      contentPreview.get.rejects();
      spaceContext.publishedCTs.refreshBare.resolves([{
        sys: {
          id: 'ct-1'
        },
        name: 'Ct - 1',
        fields: [
          {apiName: 'field1', type: 'Symbol'},
          {apiName: 'field2', type: 'Array'}
        ]
      }]);
      contentPreview.create.resolves({sys: {id: 'foo'}});
      this.isNew = true;
    });

    it('sets default title', function () {
      expect(this.scope.context.title).toBe('Untitled');
    });

    it('save button is disabled', function () {
      expect(this.elements.save.attr('aria-disabled')).toBe('true');
    });

    it('delete button is not shown', function () {
      expect(this.elements.delete.hasClass('ng-hide')).toBe(true);
    });

    it('updates name and description', function () {
      this.updateName('My PE');
      this.updateDescription('New PE');
      expect(this.scope.previewEnvironment.name).toBe('My PE');
      expect(this.scope.previewEnvironment.description).toBe('New PE');
      expect(this.scope.context.dirty).toBe(true);
    });

    it('generates empty configs from content types', function () {
      const configs = this.scope.previewEnvironment.configs;
      expect(configs.length).toBe(1);
      expect(configs[0].contentType).toBe('ct-1');
      expect(configs[0].name).toBe('Ct - 1');
      expect(configs[0].url).toBe('');
    });

    it('calls Create method and redirects on save', function () {
      this.updateName('My PE');
      this.clickSave();
      sinon.assert.calledWith(contentPreview.create, this.scope.previewEnvironment);
      sinon.assert.calledWith(
        $state.go,
        '^.detail',
        {contentPreviewId: 'foo'}
      );
    });

    it('shows notification if create fails', function () {
      contentPreview.create.rejects();
      this.updateName('My PE');
      this.clickSave();
      sinon.assert.calledWith(contentPreview.create, this.scope.previewEnvironment);
      sinon.assert.calledWith(notification.warn, 'Could not save Preview Environment');
    });

    it('shows error if name is not present on save', function () {
      this.updateDescription('description');
      this.clickSave();
      expect(this.scope.invalidFields.errors.name).toBe('Please provide a name.');
      sinon.assert.notCalled(contentPreview.create);
    });

    it('shows error if a content type is active but has no value', function () {
      this.updateName('My PE');
      setCheckbox(this.element.find('#ct-1').get(0), true);
      this.clickSave();
      expect(this.scope.invalidFields.errors.configs['ct-1']).toBeTruthy();
      sinon.assert.notCalled(contentPreview.create);
    });

    it('saves but shows warning if a field doesn\'t exist', function () {
      this.updateName('My PE');
      this.setFirstConfig('https://www.test.com/{entry_field.field1}/{entry_field.invalid}');
      this.clickSave();
      expect(this.scope.invalidFields.warnings.configs['ct-1'][0])
      .toBe('Fields with the following IDs don\'t exist in the content type: invalid');
      sinon.assert.calledWith(contentPreview.create, this.scope.previewEnvironment);
    });

    it('saves but shows warning if a field has an invalid type', function () {
      this.updateName('My PE');
      this.setFirstConfig('https://www.test.com/{entry_field.field2}');
      this.clickSave();
      expect(this.scope.invalidFields.warnings.configs['ct-1'][0])
      .toBe('Fields with the following IDs will be output as an object or array: field2');
    });

    it('shows notification and resets form when saved successfully', function () {
      this.updateName('name');
      this.clickSave();
      sinon.assert.calledOnce(notification.info);
      expect(this.scope.context.dirty).toBe(false);
      expect(this.elements.save.attr('aria-disabled')).toBe('true');
    });
  });

  describe('Edit existing content preview environment', () => {
    beforeEach(function () {
      const env = {
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

      spaceContext.publishedCTs.refreshBare.resolves([{
        sys: { id: 'foo' },
        name: 'Foo',
        fields: [{apiName: 'field1'}]
      }, {
        sys: { id: 'bar' },
        name: 'Bar',
        fields: [{apiName: 'field2'}]
      }]);
      this.isNew = false;
    });

    it('populates name and description', function () {
      expect(this.elements.name.val()).toBe('PE 1');
      expect(this.elements.description.val()).toBe('First PE');
    });

    it('displays configuration details', function () {
      const checkboxElement = this.elements.firstConfig.find('input[type="checkbox"]');
      const configElement = this.elements.firstConfig.find('input[type="text"]');
      expect(checkboxElement.prop('checked')).toBe(true);
      expect(configElement.val()).toBe('https://www.test.com');
    });

    it('adds empty config object if none exists for that content type', function () {
      const checkboxElement = this.elements.secondConfig.find('input[type="checkbox"]');
      const configElement = this.elements.secondConfig.find('input[type="text"]');

      expect(checkboxElement.prop('checked')).toBe(false);
      expect(configElement.val()).toBe('');
    });

    it('displays success message when saved successfully', function () {
      contentPreview.update.resolves({name: 'New name', sys: {id: 'foo'}});
      this.updateName('New name');
      this.clickSave();
      sinon.assert.calledWith(
        notification.info,
        'Content preview "New name" saved successfully'
      );
    });

    it('displays error when fails', function () {
      contentPreview.update.rejects();
      this.updateName('New name');
      this.clickSave();
      sinon.assert.calledWith(notification.warn, 'Could not save Preview Environment');
    });
  });
});
