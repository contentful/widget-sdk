import * as contentfulSlateJSAdapter from '@contentful/contentful-slatejs-adapter';
import * as richTextPlainTextRenderer from '@contentful/rich-text-plain-text-renderer';
import schema from 'app/widgets/rich_text/constants/Schema.es6';

export const getCharacterCount = editor => {
  const document = contentfulSlateJSAdapter.toContentfulDocument({
    document: editor.state.value.document.toJSON(),
    schema
  });
  return richTextPlainTextRenderer.documentToPlainTextString(document).length;
};
