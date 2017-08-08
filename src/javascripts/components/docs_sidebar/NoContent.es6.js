import {h} from 'ui/Framework';
import $state from '$state';
import createApiKeyAdvice from './CreateApiKeyAdvice';
import { clickLink as trackLinkClick } from 'analytics/events/DocsSidebar';

function link ({ href, sref, text }) {
  if (href) {
    return h('a.text-link', {
      href,
      target: '_blank',
      onClick: () => trackLinkClick(href)
    }, [text]);
  } else {
    return h('a.text-link', {
      onClick: (e) => {
        e.preventDefault();
        trackLinkClick($state.href(sref));
        $state.go(sref);
      }
    }, [text]);
  }
}

export default function ({ state: { spaceId, apiKeyId } }) {
  return h('div', {
    style: {
      padding: '20px 30px'
    }
  }, [
    h('.docs-sidebar__line', [
      h('p', {
        style: {
          marginBottom: 0
        }
      }, ['There is no help for this page.'])
    ]),
    h('.docs-sidebar__line', [
      h('p', {
        style: {
          marginBottom: 0
        }
      }, [
        'You can get help about ',
        link({
          sref: 'spaces.detail.content_types.list',
          text: 'content types'
        }),
        ', ',
        link({
          sref: 'spaces.detail.entries.list',
          text: 'entries'
        }),
        ', or ',
        link({
          sref: 'spaces.detail.api.keys.list',
          text: 'APIs'
        })
      ])
    ]),
    h('.docs-sidebar__link', [
      h('p', [
        'Or you can ',
        link({
          href: 'https://www.contentful.com/developers/docs/',
          text: 'view the developer docs'
        }),
        '.'
      ])
    ]),
    apiKeyId ? '' : createApiKeyAdvice(spaceId)
  ]);
}
