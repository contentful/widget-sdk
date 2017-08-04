import {h} from 'ui/Framework';
import { domain } from 'Config';
import { clickLink as trackLinkClick } from 'analytics/events/DocsSidebar';
import createApiKeyAdvice from './CreateApiKeyAdvice';

function link ({ href, text }) {
  return h('a.text-link', {
    href,
    onClick: () => trackLinkClick(href)
  }, [text]);
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
      }, ['I have no specific help for this page.'])
    ]),
    h('.docs-sidebar__line', [
      h('p', {
        style: {
          marginBottom: 0
        }
      }, ['At the moment I have help for these pages:']),
      link({
        href: `https://app.${domain}/spaces/${spaceId}/content_types`,
        text: 'Content model'
      }),
      ', ',
      link({
        href: `https://app.${domain}/spaces/${spaceId}/entries`,
        text: 'Content'
      }),
      ' and ',
      link({
        href: `https://app.${domain}/spaces/${spaceId}/api/keys`,
        text: 'APIs'
      })
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
