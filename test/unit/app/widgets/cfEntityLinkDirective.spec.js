import _ from 'lodash';

describe('cfEntityLink directive', () => {
  beforeEach(function() {
    module('contentful/test');

    const $q = this.$inject('$q');
    this.compile = function(entity, actions, config) {
      const entityHelpers = {
        entityTitle(entity, locale) {
          locale = locale || 'en-US';
          return $q.resolve(_.get(entity, ['fields', locale, 'title']));
        },
        entityDescription(entity, locale) {
          locale = locale || 'en-US';
          return $q.resolve(_.get(entity, ['fields', locale, 'title']));
        }
      };

      if (entity) {
        entity.sys = _.assign(
          {
            type: 'Entry',
            version: 1
          },
          entity.sys
        );
      }

      const element = this.$compile(
        `<cf-entity-link entity="entity" entity-helpers="entityHelpers" actions="actions" config="config"></cf-entity-link>`,
        {
          entity: entity,
          entityHelpers: entityHelpers,
          actions: actions,
          config: config
        }
      );

      const scope = element.isolateScope();
      scope.useRedesignedCardTemplate = false;
      this.$apply();
      return element.get(0);
    };
  });

  describe('title', () => {
    it('is value from entity field', function() {
      const el = this.compile({
        fields: {
          'en-US': {
            title: 'TITLE'
          }
        }
      });

      const titleEl = findById(el, 'entity-link-title');
      expect(titleEl.textContent).toBe('TITLE');
    });

    it('is "untitled" if title field is missing', function() {
      const el = this.compile({});

      const titleEl = findById(el, 'entity-link-title');
      expect(titleEl.textContent).toBe('Untitled');
    });

    it('is "missing or inaccessible" when entity is undefined', function() {
      const el = this.compile();
      const titleEl = findById(el, 'entity-link-title');
      expect(titleEl.textContent).toBe('Entity missing or inaccessible');
    });
  });

  describe('edit action', () => {
    beforeEach(function() {
      this.edit = sinon.spy();
      this.el = this.compile(
        {
          sys: {
            contentType: {
              sys: { id: 'abc' }
            }
          }
        },
        {
          edit: this.edit,
          trackEdit: sinon.stub()
        }
      );
    });

    it('is run when the title is clicked', function() {
      const titleEl = findById(this.el, 'entity-link-title');
      titleEl.click();
      sinon.assert.calledOnce(this.edit);
    });

    it('is run when the edit button is clicked', function() {
      const editButton = findById(this.el, 'entity-edit');
      editButton.click();
      sinon.assert.calledOnce(this.edit);
    });
  });

  it('runs remove action when the remove button is clicked', function() {
    const remove = sinon.spy();
    const el = this.compile(
      {},
      {
        remove: remove
      }
    );
    const removeButton = findById(el, 'entity-remove');
    removeButton.click();
    sinon.assert.calledOnce(remove);
  });

  it('links to entity', function() {
    // We need to load the states to calculate the hrefs
    this.$inject('states').loadAll();
    const el = this.compile(
      {
        sys: {
          id: 'EID',
          type: 'Entry'
        }
      },
      {},
      {
        link: true
      }
    );
    const content = findById(el, 'entity-link-content');
    expect(content.getAttribute('href')).toBe('/spaces//entries/EID');
    const edit = findById(el, 'entity-edit');
    expect(edit.getAttribute('href')).toBe('/spaces//entries/EID');
  });

  describe('"data-entity-state" attribute', () => {
    testStateAttribute('archived', {
      version: 1,
      archivedVersion: 2
    });

    testStateAttribute('draft', {
      version: 1
    });

    testStateAttribute('published', {
      version: 3,
      publishedVersion: 2
    });

    testStateAttribute('changed', {
      version: 4,
      publishedVersion: 2
    });

    function testStateAttribute(state, entrySys) {
      it(`is set to "${state}"`, function() {
        const el = this.compile({
          sys: entrySys
        });
        const status = findBySelector(el, '[data-entity-state]');
        expect(status.getAttribute('data-entity-state')).toBe(state);
      });
    }
  });

  function findById(el, id) {
    return findBySelector(el, `[data-test-id="${id}"]`);
  }

  function findBySelector(el, selector) {
    const results = el.querySelectorAll(selector);
    if (results.length === 0) {
      throw new Error(`Cannot find element with selector ${selector}`);
    } else if (results.length > 1) {
      throw new Error(`Found ${results.length} elements with selector ${selector}`);
    } else {
      return results[0];
    }
  }
});
