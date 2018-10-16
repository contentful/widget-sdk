import serializer from './Serializer.es6';
import { document, block, inline, text, leaf, mark, emptyText } from './helpers';
import { BLOCKS, MARKS, INLINES } from '@contentful/rich-text-types';
import _ from 'lodash';

const testFactory = (message, input, expected) => {
  test(message || `${input} = ${expect}`, () => {
    const actual = serializer.deserialize(input).document.toJSON();
    expect(actual).toEqual(expected);
  });
};

describe('HTML', () => {
  testFactory(
    `bold`,
    `<b>Text</b>`.trim(),
    document({}, block(BLOCKS.PARAGRAPH, {}, text({}, leaf(`Text`, mark(MARKS.BOLD)))))
  );

  testFactory(
    `italic i`,
    `<i>Text</i>`.trim(),
    document({}, block(BLOCKS.PARAGRAPH, {}, text({}, leaf(`Text`, mark(MARKS.ITALIC)))))
  );

  testFactory(
    `italic em`,
    `<em>Text</em>`.trim(),
    document({}, block(BLOCKS.PARAGRAPH, {}, text({}, leaf(`Text`, mark(MARKS.ITALIC)))))
  );

  testFactory(
    `underline`,
    `<u>Text</u>`.trim(),
    document({}, block(BLOCKS.PARAGRAPH, {}, text({}, leaf(`Text`, mark(MARKS.UNDERLINE)))))
  );

  testFactory(
    `code`,
    `<code>Text</code>`.trim(),
    document({}, block(BLOCKS.PARAGRAPH, {}, text({}, leaf(`Text`, mark(MARKS.CODE)))))
  );

  _.range(1, 7).forEach(i => {
    testFactory(
      `Heading ${i}`,
      `<h${i}>Heading ${i}</h${i}>`.trim(),
      document({}, block(BLOCKS[`HEADING_${i}`], {}, text({}, leaf(`Heading ${i}`))))
    );
  });

  testFactory(
    'anchor',
    `<a href="https://www.dict.cc/german-english/Herren.html">Herren</a>`.trim(),
    document(
      {},
      block(
        BLOCKS.PARAGRAPH,
        {},
        emptyText(),
        inline(
          INLINES.HYPERLINK,
          {
            data: {
              uri: 'https://www.dict.cc/german-english/Herren.html'
            }
          },
          text({}, leaf('Herren'))
        ),
        emptyText()
      )
    )
  );

  testFactory(
    'paragraph',
    `<p>Herren</p>`.trim(),
    document({}, block(BLOCKS.PARAGRAPH, {}, text({}, leaf('Herren'))))
  );

  testFactory('hr', `<hr />`.trim(), document({}, block(BLOCKS.HR, { isVoid: true }, emptyText())));

  testFactory(
    'quote',
    `<meta charset='utf-8'><blockquote cite="https://www.huxley.net/bnw/four.html" ><p>Words can be like X-rays, if you use them properly – they'll go through anything. You read and you're pierced.</p></blockquote>`.trim(),
    document(
      {},
      block(
        BLOCKS.QUOTE,
        {},
        block(
          BLOCKS.PARAGRAPH,
          {},
          text(
            {},
            leaf(
              `Words can be like X-rays, if you use them properly – they'll go through anything. You read and you're pierced.`
            )
          )
        )
      )
    )
  );

  [BLOCKS.OL_LIST, BLOCKS.UL_LIST].forEach(listType => {
    const htmlTag = listType === BLOCKS.UL_LIST ? 'ul' : 'ol';
    describe(listType, () => {
      testFactory(
        `wraps text in list item with paragraph`,
        `<meta charset='utf-8'><${htmlTag}><li>Mix flour, baking powder, sugar, and salt.</li></${htmlTag}>`.trim(),
        document(
          {},
          block(
            listType,
            {},
            block(
              BLOCKS.LIST_ITEM,
              {},
              block(
                BLOCKS.PARAGRAPH,
                {},
                text({}, leaf('Mix flour, baking powder, sugar, and salt.'))
              )
            )
          )
        )
      );

      testFactory(
        `preserves the child nodes of list items`,
        `<meta charset='utf-8'><${htmlTag}><li>Mix flour, baking powder, sugar, and salt.</li><li><hr /></li></${htmlTag}>`.trim(),
        document(
          {},
          block(
            listType,
            {},
            block(
              BLOCKS.LIST_ITEM,
              {},
              block(
                BLOCKS.PARAGRAPH,
                {},
                text({}, leaf('Mix flour, baking powder, sugar, and salt.'))
              )
            ),
            block(BLOCKS.LIST_ITEM, {}, block(BLOCKS.HR, { isVoid: true }, emptyText()))
          )
        )
      );

      testFactory(
        `nested lists`,
        `<meta charset='utf-8'><ul style="color: rgb(51, 51, 51); font-family: sans-serif; font-size: 14.4px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial;"><li style="list-style-type: circle;">Milk</li><li style="list-style-type: circle;">Cheese<ul><li style="list-style-type: square;">Blue cheese</li><li style="list-style-type: square;">Feta</li></ul></li></ul>`,
        document(
          {},
          block(
            BLOCKS.UL_LIST,
            {},
            block(BLOCKS.LIST_ITEM, {}, block(BLOCKS.PARAGRAPH, {}, text({}, leaf('Milk')))),
            block(
              BLOCKS.LIST_ITEM,
              {},
              block(BLOCKS.PARAGRAPH, {}, text({}, leaf('Cheese'))),
              block(
                BLOCKS.UL_LIST,
                {},
                block(
                  BLOCKS.LIST_ITEM,
                  {},
                  block(BLOCKS.PARAGRAPH, {}, text({}, leaf('Blue cheese')))
                ),
                block(BLOCKS.LIST_ITEM, {}, block(BLOCKS.PARAGRAPH, {}, text({}, leaf('Feta'))))
              )
            )
          )
        )
      );
    });
  });

  testFactory(
    `not supported tag`,
    `<img src="/media/examples/frog.png" alt="Frog"/>`.trim(),
    document({}, block(BLOCKS.PARAGRAPH, {}, text({}, leaf(''))))
  );

  testFactory(
    `not supported tag inside paragraph`,
    `<p><img src="/media/examples/frog.png" alt="Frog"/></p>`.trim(),
    document({}, block(BLOCKS.PARAGRAPH, {}, text({}, leaf(''))))
  );

  testFactory(
    `unsupported root element`,
    `<dl><dd><em>HyperText Markup Language</em> describes the structure of the page and its contents.</dd></dl>`.trim(),
    document(
      {},
      block(
        BLOCKS.PARAGRAPH,
        {},
        text(
          {},
          leaf('HyperText Markup Language', mark(MARKS.ITALIC)),
          leaf(' describes the structure of the page and its contents.')
        )
      )
    )
  );

  testFactory(
    'removes Apple-interchange-newline',
    `<p>HyperText Markup Language</p><br class="Apple-interchange-newline" />`,
    document({}, block(BLOCKS.PARAGRAPH, {}, text({}, leaf('HyperText Markup Language'))))
  );

  testFactory(
    'retains soft-break',
    `<p>HyperText Markup<br/>Language</p>`,
    document({}, block(BLOCKS.PARAGRAPH, {}, text({}, leaf('HyperText Markup\nLanguage'))))
  );
});
describe('Google Docs', () => {
  testFactory(
    'ignores wrapping b tag',
    `<meta charset='utf-8'><meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-d3549954-7fff-0957-0dd2-f2ae4a9fbb1c"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Sehr geehrte Damen und Herren</span></p></b>`,
    document({}, block(BLOCKS.PARAGRAPH, {}, text({}, leaf('Sehr geehrte Damen und Herren'))))
  );

  testFactory(
    'bold',
    `<meta charset='utf-8'><meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-f6273d47-7fff-a7ed-f53b-f11da8984a92"><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Sehr geehrte </span><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:700;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Damen</span><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;"> und Herren</span></b>`,
    document(
      {},
      block(
        BLOCKS.PARAGRAPH,
        {},
        text({}, leaf('Sehr geehrte '), leaf('Damen', mark(MARKS.BOLD)), leaf(' und Herren'))
      )
    )
  );

  testFactory(
    'italic',
    `<meta charset='utf-8'><meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-63f57981-7fff-fb19-466c-7e0bd418b994"><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Sehr geehrte </span><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:italic;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Damen</span><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;"> und Herren</span></b>`,
    document(
      {},
      block(
        BLOCKS.PARAGRAPH,
        {},
        text({}, leaf('Sehr geehrte '), leaf('Damen', mark(MARKS.ITALIC)), leaf(' und Herren'))
      )
    )
  );

  testFactory(
    'underline',
    `<meta charset='utf-8'><meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-8d3c7835-7fff-da0f-38eb-1477ff1e7735"><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Sehr geehrte </span><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:underline;-webkit-text-decoration-skip:none;text-decoration-skip-ink:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Damen</span><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;"> und Herren</span></b>`,
    document(
      {},
      block(
        BLOCKS.PARAGRAPH,
        {},
        text({}, leaf('Sehr geehrte '), leaf('Damen', mark(MARKS.UNDERLINE)), leaf(' und Herren'))
      )
    )
  );

  testFactory(
    'bold and italic',
    `<meta charset='utf-8'><meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-829af27b-7fff-2bef-07b2-63bfb4244318"><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Sehr geehrte </span><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:700;font-style:italic;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Damen</span><span style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;"> und Herren</span></b>`,
    document(
      {},
      block(
        BLOCKS.PARAGRAPH,
        {},
        text(
          {},
          leaf('Sehr geehrte '),
          leaf('Damen', mark(MARKS.BOLD), mark(MARKS.ITALIC)),
          leaf(' und Herren')
        )
      )
    )
  );
});
