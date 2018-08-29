import * as Analytics from 'analytics/Analytics';

export const trackMarkdownEditorAction = (action, { newValue, fullscreen }) =>
  Analytics.track('markdown_editor:action', {
    action,
    fullscreen: !!fullscreen,
    ...(newValue !== undefined ? { new_value: newValue } : {})
  });
