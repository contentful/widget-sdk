'use strict';

describe('cfWidgetRenderer Directive', function () {
  beforeEach(function () {
    module('cf.app', function ($provide) {
      $provide.value('$state', {
        href: function (state, params) {
          return '/spaceHref/' + params.contentTypeId;
        }
      });
    });

    this.widget = {};
    this.contentType = {
      getId: sinon.stub().returns('CTID')
    };

    this.compile = function () {
      return this.$compile('<cf-widget-renderer>', {
        widget: this.widget,
        contentType: this.contentType
      });
    };
  });

  it('renders a widget template', function() {
    this.widget.template = '<p class=foo>';
    var el = this.compile();
    expect(el.find('.foo').length).toBe(1);
  });

  it('has scope#contentTypeStateRef property', function() {
    this.widget.template = '<p>{{contentTypeHref}}</p>';
    var el = this.compile();
    expect(el.find('p').text())
    .toEqual('/spaceHref/CTID');
  });

  it('does not have scope#contentTypeStateRef property if there is no content type', function() {
    this.widget.template = '<p>{{contentTypeHref}}</p>';
    this.contentType = {};
    var el = this.compile();
    expect(el.find('p').text())
    .toEqual('');
  });
});
