import { identity } from 'lodash';
import sinon from 'sinon';
import { $initialize, $compile, $apply } from 'test/helpers/helpers';

describe('cfWidgetRenderer Directive', () => {
  beforeEach(async function() {
    this.system.set('app/entity_editor/LoadEventTracker.es6', {
      createLinksRenderedEvent: () => () => {},
      createWidgetLinkRenderEventsHandler: () => () => {}
    });
    this.system.set('lodash/debounce', {
      default: identity
    });

    module('contentful/test', $provide => {
      $provide.value('$state', {
        href: function(_state, params) {
          return '/spaceHref/' + params.contentTypeId;
        }
      });
    });

    await $initialize();

    this.widget = {
      widgetNamespace: 'builtin'
    };

    this.entityInfo = {
      contentTypeId: 'CTID'
    };

    this.fieldLocale = {
      setActive: sinon.stub(),
      revalidate: sinon.stub()
    };

    this.compile = function() {
      return $compile('<cf-widget-renderer>', {
        widget: this.widget,
        entityInfo: this.entityInfo,
        fieldLocale: this.fieldLocale,
        localeData: {},
        entrySidebarProps: {
          emitter: {
            on: sinon.stub()
          }
        }
      });
    };
  });

  it('renders a widget template', function() {
    this.widget.template = '<p class=foo>';
    const el = this.compile();
    expect(el.find('.foo').length).toBe(1);

    el.remove();
  });

  it('activates field locale when element is focused', function() {
    this.widget.template = '<div>';
    const el = this.compile();
    el.trigger('focusin');
    $apply();
    sinon.assert.calledOnce(this.fieldLocale.setActive);
    sinon.assert.calledWith(this.fieldLocale.setActive, true);

    el.remove();
  });

  it('deactivates field locale when element is unfocused', function() {
    this.widget.template = '<div>';
    const el = this.compile();
    el.trigger('focusout');
    $apply();

    sinon.assert.calledOnce(this.fieldLocale.setActive);
    sinon.assert.calledWith(this.fieldLocale.setActive, false);

    el.remove();
  });

  it('revalidates field locale when element is unfocused', function() {
    this.widget.template = '<div>';
    const el = this.compile();
    el.trigger('focusout');
    $apply();

    sinon.assert.calledOnce(this.fieldLocale.revalidate);

    el.remove();
  });
});
