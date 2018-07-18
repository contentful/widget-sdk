import * as Analytics from 'analytics/Analytics';

export const trackMarkdownEditorAction = (action, zen = false, payload = {}) =>
  Analytics.track(
    'markdown_editor:action',
    {action, fullscreen: zen, ...payload}
  );
