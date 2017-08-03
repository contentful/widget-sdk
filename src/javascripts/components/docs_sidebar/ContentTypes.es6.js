import {h} from 'ui/Framework';
import clickToCopy from './InputWithCopy';
import { byName as colorByName } from 'Styles/Colors';
import { clickLink as trackLinkClick } from 'analytics/events/DocsSidebar';
import { domain } from 'Config';

export default function template (data) {
  const otherQueriesLink = 'https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/content-types';
  const apiKeyLink = `https://app.${domain}/spaces/${data.state.spaceId}/api/keys/${data.state.apiKeyId}`;

  return h('div', {
    style: {
      padding: '20px 30px'
    }
  }, [
    h('.docs-sidebar__line', [
      h('p', [
        'These are your ',
        h('strong', ['content types']),
        ', which are similar to schemas, and for each content type,',
        'you can customize its fields and field properties.'
      ])
    ]),
    h('.docs-sidebar__line', [
      h('p', ['Here we have example content types for Brand, Category and Product.'])
    ]),
    h('.docs-sidebar__line', [
      h('strong', [`Try and fetch your "${data.state.contentType.name}" content type:`]),
      clickToCopy(curl(data), data.actions.render),
      h('p', [
        'Read about ',
        h('a.text-link', {
          href: otherQueriesLink,
          target: '_blank',
          onClick: () => trackLinkClick(otherQueriesLink)
        }, ['other types of queries']),
        ' you can perform.'
      ])
    ]),
    h('.docs-sidebar__line', [
      h('strong', ['What‘s next?']),
      h('a.text-link', {
        href: apiKeyLink,
        style: {
          display: 'block',
          marginTop: '10px'
        },
        onClick: () => trackLinkClick(apiKeyLink)
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
