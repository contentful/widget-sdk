describe('markdown actions', function() {
  beforeEach(function() {
    this.analytics = { track: sinon.spy() };
    module('contentful/test', $provide => {
      $provide.value('analytics/Analytics.es6', this.analytics);
    });

    this.markdownActions = this.$inject('markdown_editor/markdown_actions.es6');

    this.createActionsWithStubbedAction = (stubbedAction, zen) => {
      const editor = { actions: { [stubbedAction]: sinon.spy() } };
      const locale = {};
      const defaultLocaleCode = null;
      return this.markdownActions.create(editor, locale, defaultLocaleCode, { zen });
    };
  });

  it('tracks when editor action is called', function() {
    const actions = this.createActionsWithStubbedAction('bold', true);
    actions.bold();
    sinon.assert.calledOnceWith(this.analytics.track, 'markdown_editor:action', {
      action: 'bold',
      fullscreen: true
    });
  });

  it('tracks if fullscreen was used', function() {
    const actions = this.createActionsWithStubbedAction('bold', undefined);
    actions.bold();
    sinon.assert.calledOnceWith(this.analytics.track, 'markdown_editor:action', {
      action: 'bold',
      fullscreen: false
    });
  });

  it('tracks when advanced action is called', function() {
    const actions = this.createActionsWithStubbedAction('special', undefined);
    actions.special();
    sinon.assert.calledOnceWith(this.analytics.track, 'markdown_editor:action', {
      action: 'special',
      fullscreen: false
    });
  });
});
