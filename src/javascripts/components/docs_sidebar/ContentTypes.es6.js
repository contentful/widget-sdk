import {h} from 'ui/Framework';
import clickToCopy from './InputWithCopy';
import { byName as colorByName } from 'Styles/Colors';
import { clickLink as trackLinkClick } from 'analytics/events/DocsSidebar';
import { domain } from 'Config';
import $state from '$state';
import createApiKeyAdvice from './CreateApiKeyAdvice';

export default function template (data) {
  const otherQueriesLink = 'https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/content-types';
  const apiKeyDetail = 'spaces.detail.api.keys.detail';
  const params = {apiKeyId: data.state.apiKeyId};

  return h('div', {
    style: {
      padding: '20px 30px'
    }
  }, [
    h('.docs-sidebar__line', [
      h('p', [
        'These are your ',
        h('strong', ['content types']),
        ', which are similar to schemas, and for each content type, ',
        'you can customize its fields and field properties.'
      ])
    ]),
    h('.docs-sidebar__line', [
      h('strong', [`Fetch the content type named '${data.state.contentType.name}'.`]),
      data.state.apiKeyId ? clickToCopy(curl(data), data.actions.render) : createApiKeyAdvice(data.state.spaceId),
      h('p', [
        'You can read about ',
        h('a.text-link', {
          href: otherQueriesLink,
          target: '_blank',
          onClick: () => trackLinkClick(otherQueriesLink)
        }, ['other content type queries']),
        '.'
      ])
    ]),
    h('.docs-sidebar__line', [
      h('strong', {
        style: {
          display: 'block',
          marginBottom: '10px'
        }
      }, ['What‘s next?']),
      h('a.text-link', {
        onClick: (e) => {
          e.preventDefault();
          trackLinkClick($state.href(apiKeyDetail, params));
          $state.go(apiKeyDetail, params);
        }
      }, ['Download a code boilerplate'])
    ])
  ]);
}

function curl (data) {
  const colorBlue = colorize(colorByName.blueDarkest);
  const colorGreen = colorize(colorByName.greenDarkest);

  return {
    children: [
      h('pre', {
        style: {
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          color: colorByName.textMid
        }
      }, [
        h('span', [`curl https://cdn.${domain}/`]),
        h('span', colorBlue, ['spaces']),
        h('span', ['/']),
        h('span', colorGreen, [`${data.state.spaceId}`]),
        h('span', ['/']),
        h('span', colorBlue, ['content_types']),
        h('span', ['/']),
        h('span', colorGreen, [`${data.state.contentType.id}`]),
        h('span', ['?']),
        h('span', colorBlue, ['access_token']),
        h('span', ['=']),
        h('span', colorGreen, [`${data.state.token}`])
      ])
    ],
    text: `curl 'https://cdn.${domain}/spaces/${data.state.spaceId}/content_types/${data.state.contentType.id}?access_token=${data.state.token}'`,
    id: 'contentTypesCurl'
  };

  function colorize (color) {
    return {
      style: {
        color: `${color}`
      }
    };
  }
}
