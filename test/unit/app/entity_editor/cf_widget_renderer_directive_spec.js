'use strict';

describe('cfWidgetRenderer Directive', () => {
  beforeEach(function () {
    module('cf.app', $provide => {
      $provide.value('$state', {
        href: function (_state, params) {
          return '/spaceHref/' + params.contentTypeId;
        }
      });
    });

    this.widget = {};
    this.contentType = {
      getId: sinon.stub().returns('CTID')
    };

    this.fieldLocale = {
      setActive: sinon.stub(),
      revalidate: sinon.stub()
    };

    this.compile = function () {
      return this.$compile('<cf-widget-renderer>', {
        widget: this.widget,
        contentType: this.contentType,
        fieldLocale: this.fieldLocale
      });
    };
  });

  it('renders a widget template', function () {
    this.widget.template = '<p class=foo>';
    const el = this.compile();
    expect(el.find('.foo').length).toBe(1);
  });

  it('has scope#contentTypeStateRef property', function () {
    this.widget.template = '<p>{{contentTypeHref}}</p>';
    const el = this.compile();
    expect(el.find('p').text())
    .toEqual('/spaceHref/CTID');
  });

  it('does not have scope#contentTypeStateRef property if there is no content type', function () {
    this.widget.template = '<p>{{contentTypeHref}}</p>';
    this.contentType = {};
    const el = this.compile();
    expect(el.find('p').text())
    .toEqual('');
  });

  it('activates field locale when element is focused', function () {
    this.widget.template = '<div>';
    const el = this.compile();
    el.trigger('focusin');
    this.$apply();
    sinon.assert.calledOnce(this.fieldLocale.setActive);
    sinon.assert.calledWith(this.fieldLocale.setActive, true);
  });

  it('deactivates field locale when element is unfocused', function () {
    this.widget.template = '<div>';
    const el = this.compile();
    el.trigger('focusout');
    this.$apply();
    sinon.assert.calledOnce(this.fieldLocale.setActive);
    sinon.assert.calledWith(this.fieldLocale.setActive, false);
  });

  it('revalidates field locale when element is unfocused', function () {
    this.widget.template = '<div>';
    const el = this.compile();
    el.trigger('focusout');
    this.$apply();
    sinon.assert.calledOnce(this.fieldLocale.revalidate);
  });
});
