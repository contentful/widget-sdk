import {h} from 'utils/hyperscript';
import {
  dragHandle,
  actions
} from './TemplateCommons';

export default function () {
  return h('.user-link', [
    dragHandle(),
    h('img.entity-link__image', {
      ngIf: 'config.showDetails',
      ngSrc: '{{entity.avatarUrl}}'
    }),
    h('.entity-link__text', [
      h('.user-link__full-name', {
        ngIf: 'entity.firstName || entity.lastName'
      }, [
        '{{ entity.firstName }} {{ entity.lastName }}',
        unconfirmed('!entity.confirmed')
      ]),
      h('.user-link__email', [
        h('span', [
          '{{ entity.email | truncateMiddle:45:15 }}',
          unconfirmed('!entity.confirmed && !entity.firstName && !entity.lastName')
        ])
      ]),
      actions()
    ])
  ]);
}

function unconfirmed (conditions) {
  return h('span.user-link__unconfirmed', {ngIf: conditions}, [
    '&#32;(',
    h('a', {
      ngIf: 'entity.activated',
      tooltip: 'This user hasn’t confirmed their email address yet. Therefore  we can’t guarantee the identity of the user',
      tooltipPlacement: 'bottom'
    }, ['not confirmed']),
    h('a', {
      ngIf: '!entity.activated',
      tooltip: 'This user hasn’t accepted the invitation to your organization yet.',
      tooltipPlacement: 'bottom'
    }, ['hasn’t accepted invitation']),
    ')'
  ]);
}
