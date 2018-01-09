import { h } from 'ui/Framework';

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
export default function makeBase (stateDefinition) {
  stateDefinition.template = wrapTemplate({
    template: stateDefinition.template,
    loadingText: getLoadingText(stateDefinition)
  });
  return stateDefinition;
}


function getLoadingText (stateDefinition) {
  if (stateDefinition.loadingText) {
    return stateDefinition.loadingText;
  } else if (stateDefinition.label) {
    return `Loading ${stateDefinition.label}...`;
  } else {
    return 'Please hold on…';
  }
}


function wrapTemplate ({ template, loadingText }) {
  if (!Array.isArray(template)) {
    template = [template];
  }
  return [
    h('div', {
      ngShow: 'context.ready && !context.forbidden'
    }, [
      h('cf-loader', {
        watchStateChange: 'true'
      }),
      ...template
    ]),
    h('cf-loader', {
      isShown: '!context.ready && !context.forbidden',
      loaderMsg: loadingText
    }),
    h('div.workbench.workbench-forbidden.x--center', {
      ngShow: 'context.forbidden'
    }, [
      h('div.workbench-forbidden__headline', [
        `You don’t have permission to access this view`
      ]),
      h('div.workbench-forbidden__message', [
        `Get in touch with the person administering Contentful at your
        company to learn more`
      ])
    ])
  ];
}
