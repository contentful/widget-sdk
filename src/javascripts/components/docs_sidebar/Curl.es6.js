import { h } from 'ui/Framework';
import clickToCopy from './InputWithCopy';
import { byName as colorByName } from 'Styles/Colors';
import { repeat } from 'lodash';

export default function (url, id, render) {
  return clickToCopy({
    children: [makeCurl(url)],
    text: `curl '${url}'`,
    id
  }, render);
}

function makeCurl (url) {
  const blue = colorize(colorByName.blueDarkest);
  const green = colorize(colorByName.greenDarkest);

  let colors = [blue, green];

  const [protocol, domain, ...rest] = url.split('/').filter(v => !!v);

  // https://cdn.flinkly.com/
  const host = h('span', [`curl ${protocol}//${domain}/`]);

  // ['spaces', 'SPACEID', 'content_types']
  const uri = rest.slice(0, -1);

  // ['entries', 'access_token=xyz&content_type=abc']
  const [slug, queryParamsString] = rest[rest.length - 1].split('?');

  // [['access_token', '=', 'xyz'], ['content_type', '=', 'abc']]
  const queryParamPairs = queryParamsString.split('&').map(pair => {
    const [key, value] = pair.split('=');

    return [key, '=', value];
  });

  const splitUrl = _.flattenDeep(
    [].concat(
      _.zip(uri, repeat('/', uri.length).split('')),
      _.zip([slug], ['?']),
      _.zip(queryParamPairs, repeat('&', queryParamPairs.length - 1).split(''))
    )
  ).filter(v => !!v);


  const children = [host].concat(
    splitUrl.map((chunk, i) => {
      let color = {};

      if (chunk === '?') {
        colors = [blue, green];
      }
      if (i % 2 === 0) {
        color = colors[0];
        colors.reverse();
      }

      return h('span', color, [chunk]);
    })
  );

  return h('pre', {
    style: {
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      color: colorByName.textMid
    }
  }, children);
}

function colorize (color) {
  return {
    style: {
      color: `${color}`
    }
  };
}
