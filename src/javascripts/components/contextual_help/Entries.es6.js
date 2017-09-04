import {h} from 'ui/Framework';
import { clickLink as trackLinkClick } from 'analytics/events/ContextualHelp';
import $state from '$state';
import createApiKeyAdvice from './CreateApiKeyAdvice';
import curl from './Curl';

const otherQueriesLink = 'https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/entries';
const contentTypesList = 'spaces.detail.content_types.list';

export default function template (data) {
  return h('div', {
    style: {
      padding: '20px 30px'
    }
  }, [
    h('.contextual-help__line', [
      h('p', ['These are your ', h('strong', ['entries']), ', which you use to create written content and to manage media.'])
    ]),
    h('.contextual-help__line', [
      h('p', ['Each entry’s fields are defined by the way you customize the fields in your content types'])
    ]),
    h('.contextual-help__line', [
      h('strong', [`Fetch the entries for the content type named '${data.state.contentType.name}'.`]),
      data.state.apiKeyId ? curl({
        path: ['spaces', data.state.spaceId, 'entries'],
        params: [
          ['access_token', data.state.token],
          ['content_type', data.state.contentType.id]
        ],
        id: 'entriesCurl'
      }, data.actions.render) : createApiKeyAdvice(data.state.spaceId),
      h('p', [
        'You can read about ',
        h('a.text-link', {
          href: otherQueriesLink,
          target: '_blank',
          onClick: () => trackLinkClick(otherQueriesLink)
        }, ['other entry queries']),
        '.'
      ])
    ]),
    h('.contextual-help__line', [
      h('strong', {
        style: {
          display: 'block',
          marginBottom: '10px'
        }
      }, ['What‘s next?']),
      h('a.text-link', {
        onClick: (e) => {
          e.preventDefault();
          trackLinkClick($state.href(contentTypesList));
          $state.go(contentTypesList);
        }
      }, ['Play with your content types'])
    ])
  ]);
}
