import React from 'react';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';

import { mockDocument } from './__mocks__/richText';
import { ContentfulRichText } from './ContentfulRichText';

describe('ContentfulRichText', () => {
  describe('Paragraphs', () => {
    it('renders a F36 Paragraph component for each nodeType "paragraph" in the document prop', () => {
      build();

      const paragraphs = screen.getAllByTestId('cf-ui-paragraph');
      for (const paragraph of paragraphs) {
        expect(paragraph.textContent).toContain('This is a mock text for a paragraph node');
      }
    });

    it('renders each "paragraph" with the customRenderNode method passed to ContentfulRichText', () => {
      build({
        customRenderNode: {
          [BLOCKS.PARAGRAPH]: (_node, children) => (
            <span className="custom-class" data-test-id="custom-paragraph">
              {children}
            </span>
          ),
        },
      });

      const customParagraphs = screen.getAllByTestId('custom-paragraph');
      expect(customParagraphs).toHaveLength(2);
      for (const paragraph of customParagraphs) {
        expect(paragraph).toHaveClass('custom-class');
        expect(paragraph.textContent).toContain('This is a mock text for a paragraph node');
      }
    });
  });

  describe('Hyperlinks', () => {
    it('renders a F36 TextLink component for each nodeType "hyperlink" in the document prop', () => {
      build();

      const link = screen.getByTestId('cf-ui-text-link');
      expect(link.textContent).toBe('this is a link');
    });

    it('renders each "hyperlink" with the customRenderNode method passed to ContentfulRichText', () => {
      build({
        customRenderNode: {
          [INLINES.HYPERLINK]: (node) => {
            const { content } = node;

            return (
              <span className="custom-class" data-test-id="custom-link">
                {content.map(({ value }) => value)}
              </span>
            );
          },
        },
      });

      const customLink = screen.getByTestId('custom-link');
      expect(customLink).toHaveClass('custom-class');
      expect(customLink.textContent).toBe('this is a link');
    });
  });

  describe('Tables', () => {
    it('renders a F36 Table component for a contentType "webappTable" that is embedded in rich text as a block', () => {
      build();

      const table = screen.getByTestId('cf-ui-table');
      const tableHead = screen.getByTestId('cf-ui-table-head');
      const tableBody = screen.getByTestId('cf-ui-table-body');

      expect(table).toBeVisible();

      expect(tableHead).toBeVisible();
      expect(within(tableHead).getAllByTestId('cf-ui-table-row')).toHaveLength(1);
      expect(within(tableHead).getAllByTestId('cf-ui-table-cell')).toHaveLength(3);

      expect(tableBody).toBeVisible();
      expect(within(tableBody).getAllByTestId('cf-ui-table-row')).toHaveLength(2);
      expect(within(tableBody).getAllByTestId('cf-ui-table-cell')).toHaveLength(6);
    });

    it('renders a F36 Tooltip component for a contentType "tooltip" that is referenced in a Table’s extra field', async () => {
      build();

      const tableCellWithTooltip = screen.getByText('row I & column I (with tooltip)');
      const infoIcon = screen.getByTestId('cf-ui-icon');

      expect(tableCellWithTooltip).toBeVisible();
      expect(infoIcon).toBeVisible();

      fireEvent.mouseOver(infoIcon);

      await waitFor(() => expect(screen.getByRole('tooltip')).toBeVisible());
    });

    it('renders each "webappTable" with the customRenderNode method passed to ContentfulRichText', () => {
      build({
        customRenderNode: {
          [BLOCKS.EMBEDDED_ENTRY]: (_node) => (
            <span className="custom-class" data-test-id="custom-table">
              my custom table
            </span>
          ),
        },
      });

      const customTable = screen.getByTestId('custom-table');
      expect(customTable).toHaveClass('custom-class');
      expect(customTable.textContent).toBe('my custom table');
    });
  });
});

function build(customProps) {
  const props = {
    document: mockDocument,
    ...customProps,
  };

  render(<ContentfulRichText {...props} />);
}
