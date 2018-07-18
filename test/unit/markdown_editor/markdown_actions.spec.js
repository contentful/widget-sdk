describe('markdown actions', function () {
  beforeEach(function () {
    this.analytics = {track: sinon.spy()};
    module('contentful/test', $provide => {
      $provide.value('analytics/Analytics', this.analytics);
    });

    this.markdownActions = this.$inject('markdown_editor/markdown_actions');
  });

  it('track when editor action is called', function () {
    const editor = {actions: {bold: sinon.spy()}};
    const locale = {};
    const defaultLocaleCode = null;
    const actions = this.markdownActions.create(
      editor,
      locale,
      defaultLocaleCode,
      {fullscreen: false}
    );
    actions.bold();
    sinon.assert.calledOnceWith(
      this.analytics.track,
      'markdown_editor:action',
      {
        action: 'bold',
        fullscreen: false
      }
    );
  });

  it('track when advanced action is called', function () {
    const editor = {actions: {special: sinon.spy()}};
    const locale = {};
    const defaultLocaleCode = null;
    const actions = this.markdownActions.create(
      editor,
      locale,
      defaultLocaleCode,
      {fullscreen: false}
    );
    actions.special();
    sinon.assert.calledOnceWith(
      this.analytics.track,
      'markdown_editor:action',
      {
        action: 'special',
        fullscreen: false
      }
    );
  });
});
