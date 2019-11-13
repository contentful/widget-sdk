import { h } from 'utils/legacy-html-hyperscript';

/**
 * Take an Angular UI router state definition and wrap its template to
 * support an “access forbidden” and a “loading” view.
 *
 * If a state is constructed with this view its template is wrapped so
 * that we
 * - show a loader if `$scope.context.ready` is not true
 * - show a “permission denied” message if `$scope.context.forbidden`
 *   is true
 * - show a loader if a state change is in progress (using the
 *   `cfLoader` directive)
 * - show the original template otherwise.
 */
export default function makeBase(stateDefinition) {
  const wrapped = {
    ...stateDefinition,
    template: wrapTemplate(stateDefinition)
  };

  delete wrapped.loadingText;

  return wrapped;
}

function wrapTemplate(stateDefinition) {
  const loadingText = stateDefinition.loadingText || 'Please hold on…';
  let template = stateDefinition.template;
  if (typeof template === 'undefined') {
    template = [];
  }

  if (!Array.isArray(template)) {
    template = [template];
  }

  return [
    h(
      'div',
      {
        ngShow: 'context.ready && !context.forbidden'
      },
      [
        h('cf-loader', {
          watchStateChange: 'true'
        }),
        ...template
      ]
    ),
    h('cf-loader', {
      isShown: '!context.ready && !context.forbidden',
      loaderMsg: loadingText
    }),
    h(
      'div.workbench.workbench-forbidden.x--center',
      {
        ngShow: 'context.forbidden'
      },
      [
        h('div.workbench-forbidden__over-headline', ['Access forbidden (403)']),
        h('div.workbench-forbidden__headline', [`You don’t have access to this page.`]),
        h('div.workbench-forbidden__message', [
          `Contact the administrator of this space to get access.`
        ])
      ]
    )
  ].join('');
}
