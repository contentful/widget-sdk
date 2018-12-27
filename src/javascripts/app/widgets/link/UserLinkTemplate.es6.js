import { h } from 'utils/legacy-html-hyperscript/index.es6';

export default function() {
  return h('.user-link', { dataUserEmail: '{{user.email}}' }, [
    h('img.entity-link__image', {
      ngSrc: '{{user.avatarUrl}}'
    }),
    h('.entity-link__text', [
      h(
        '.user-link__full-name',
        {
          ngIf: 'user.firstName || user.lastName'
        },
        ['{{ user.firstName }} {{ user.lastName }}', unconfirmed('!user.confirmed')]
      ),
      h('.user-link__email', [
        h('span', [
          '{{ user.email | truncateMiddle:45:15 }}',
          unconfirmed('!user.confirmed && !user.firstName && !user.lastName')
        ])
      ])
    ])
  ]);
}

function unconfirmed(conditions) {
  return h('span.user-link__unconfirmed', { ngIf: conditions }, [
    '&#32;(',
    h(
      'a',
      {
        ngIf: 'user.activated',
        tooltip:
          'This user hasn’t confirmed their email address yet. Therefore  we can’t guarantee the identity of the user',
        tooltipPlacement: 'bottom'
      },
      ['not confirmed']
    ),
    h(
      'a',
      {
        ngIf: '!user.activated',
        tooltip: 'This user hasn’t accepted the invitation to your organization yet.',
        tooltipPlacement: 'bottom'
      },
      ['hasn’t accepted invitation']
    ),
    ')'
  ]);
}
