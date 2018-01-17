import {createElement as h} from 'libs/react';

const PRICE_FORMATS = {
  'FlatFee': '(flat fee)',
  'PerUnit': 'per unit'
};

export function TiersTable ({charge}) {
  return h('section', {className: 'u-separator'},
    h('h3', {className: 'section-title'}, charge.name),
    h('table',
      {className: 'deprecated-table'},
      h('thead', null,
        h('tr', null,
          h('th', {width: '20%'}, 'Tier'),
          h('th', {width: '20%'}, 'Start'),
          h('th', {width: '20%'}, 'End'),
          h('th', {width: '20%'}, 'Price'),
          h('th', {width: '20%'}, 'Price format')
        )
      ),
      h('tbody', null,
        charge.tiers.map(row => h('tr', {key: row.tier},
          h('td', null, row.tier),
          h('td', null, row.startingUnit),
          h('td', null, row.endingUnit),
          h('td', null, `$${row.price}`),
          h('td', null, PRICE_FORMATS[row.priceFormat])
        ))
      )
    )
  );
}