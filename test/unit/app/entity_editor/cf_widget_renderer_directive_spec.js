describe('cfWidgetRenderer Directive', () => {
  beforeEach(function() {
    module('contentful/test', $provide => {
      $provide.value('$state', {
        href: function(_state, params) {
          return '/spaceHref/' + params.contentTypeId;
        }
      });
    });

    this.widget = {};

    this.entityInfo = {
      contentTypeId: 'CTID'
    };

    this.fieldLocale = {
      setActive: sinon.stub(),
      revalidate: sinon.stub()
    };

    this.compile = function() {
      return this.$compile('<cf-widget-renderer>', {
        widget: this.widget,
        entityInfo: this.entityInfo,
        fieldLocale: this.fieldLocale
      });
    };
  });

  it('renders a widget template', function() {
    this.widget.template = '<p class=foo>';
    const el = this.compile();
    expect(el.find('.foo').length).toBe(1);
  });

  it('activates field locale when element is focused', function() {
    this.widget.template = '<div>';
    const el = this.compile();
    el.trigger('focusin');
    this.$apply();
    sinon.assert.calledOnce(this.fieldLocale.setActive);
    sinon.assert.calledWith(this.fieldLocale.setActive, true);
  });

  it('deactivates field locale when element is unfocused', function() {
    this.widget.template = '<div>';
    const el = this.compile();
    el.trigger('focusout');
    this.$apply();
    sinon.assert.calledOnce(this.fieldLocale.setActive);
    sinon.assert.calledWith(this.fieldLocale.setActive, false);
  });

  it('revalidates field locale when element is unfocused', function() {
    this.widget.template = '<div>';
    const el = this.compile();
    el.trigger('focusout');
    this.$apply();
    sinon.assert.calledOnce(this.fieldLocale.revalidate);
  });
});
