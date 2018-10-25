import React from 'react';
import PropTypes from 'prop-types';

import { EditorToolbar, EditorToolbarDivider } from '@contentful/ui-component-library';

import Bold from '../plugins/Bold/index.es6';
import Italic from '../plugins/Italic/index.es6';
import Underlined from '../plugins/Underlined/index.es6';
import Code from '../plugins/Code/index.es6';
import Quote from '../plugins/Quote/index.es6';
import Hyperlink from '../plugins/Hyperlink/index.es6';
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Paragraph,
  HeadingDropdown
} from '../plugins/Heading/index.es6';

import EmbeddedEntityBlock from '../plugins/EmbeddedEntityBlock/index.es6';
import EmbeddedEntryInline from '../plugins/EmbeddedEntryInline/index.es6';
import EntryEmbedDropdown from '../plugins/EntryEmbedDropdown/index.es6';

import { UnorderedList, OrderedList } from '../plugins/List/index.es6';
import Hr from '../plugins/Hr/index.es6';

import { BLOCKS, MARKS, INLINES } from '@contentful/rich-text-types';

import { isNodeTypeEnabled, isMarkEnabled } from '../validations/index.es6';

import Visible from '../../../../components/shared/Visible/index.es6';

export default class Toolbar extends React.Component {
  static propTypes = {
    widgetAPI: PropTypes.object.isRequired,
    isDisabled: PropTypes.bool.isRequired,
    change: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  };

  state = {
    headingMenuOpen: false
  };

  onChange = (...args) => {
    this.setState({ headingMenuOpen: false });
    this.props.onChange(...args);
  };

  toggleEmbedDropdown = () =>
    this.setState({
      isEmbedDropdownOpen: !this.state.isEmbedDropdownOpen
    });

  handleEmbedDropdownClose = () =>
    this.setState({
      isEmbedDropdownOpen: false
    });

  renderEmbeds = props => {
    const { field } = this.props.widgetAPI;
    return (
      <div className="rich-text__toolbar__embed-actions-wrapper">
        <Visible if={isNodeTypeEnabled(field, BLOCKS.EMBEDDED_ASSET)}>
          <EmbeddedEntityBlock nodeType={BLOCKS.EMBEDDED_ASSET} isButton {...props} />
        </Visible>
        {this.props.widgetAPI.features.embedInlineEntry ? (
          <Visible
            if={
              isNodeTypeEnabled(field, BLOCKS.EMBEDDED_ENTRY) ||
              isNodeTypeEnabled(field, INLINES.EMBEDDED_ENTRY)
            }>
            <EntryEmbedDropdown
              onToggle={this.toggleEmbedDropdown}
              isOpen={this.state.isEmbedDropdownOpen}
              disabled={props.disabled}
              onClose={this.handleEmbedDropdownClose}>
              <Visible if={isNodeTypeEnabled(field, BLOCKS.EMBEDDED_ENTRY)}>
                <EmbeddedEntityBlock nodeType={BLOCKS.EMBEDDED_ENTRY} {...props} />
              </Visible>
              <Visible if={isNodeTypeEnabled(field, INLINES.EMBEDDED_ENTRY)}>
                <EmbeddedEntryInline {...props} />
              </Visible>
            </EntryEmbedDropdown>
          </Visible>
        ) : (
          <EmbeddedEntityBlock nodeType={BLOCKS.EMBEDDED_ENTRY} isButton {...props} />
        )}
      </div>
    );
  };

  getValidationInfo() {
    const { field } = this.props.widgetAPI;
    const isAnyMarkEnabled =
      isMarkEnabled(field, MARKS.BOLD) ||
      isMarkEnabled(field, MARKS.ITALIC) ||
      isMarkEnabled(field, MARKS.UNDERLINE) ||
      isMarkEnabled(field, MARKS.CODE);

    const isAnyHyperlinkEnabled =
      isNodeTypeEnabled(field, INLINES.HYPERLINK) ||
      isNodeTypeEnabled(field, INLINES.ASSET_HYPERLINK) ||
      isNodeTypeEnabled(field, INLINES.ENTRY_HYPERLINK);

    const isAnyListEnabled =
      isNodeTypeEnabled(field, BLOCKS.UL_LIST) ||
      isNodeTypeEnabled(field, BLOCKS.OL_LIST) ||
      isNodeTypeEnabled(field, BLOCKS.QUOTE) ||
      isNodeTypeEnabled(field, BLOCKS.HR);
    return {
      isAnyMarkEnabled,
      isAnyHyperlinkEnabled,
      isAnyListEnabled
    };
  }

  toggleHeadingMenu = event => {
    event.preventDefault();
    this.setState({
      headingMenuOpen: !this.state.headingMenuOpen
    });
  };

  closeHeadingMenu = () =>
    this.setState({
      headingMenuOpen: false
    });

  render() {
    const props = {
      change: this.props.change,
      onToggle: this.onChange,
      disabled: this.props.isDisabled
    };

    const { field } = this.props.widgetAPI;

    const { isAnyHyperlinkEnabled, isAnyListEnabled, isAnyMarkEnabled } = this.getValidationInfo();

    return (
      <EditorToolbar extraClassNames="rich-text__toolbar" data-test-id="toolbar">
        <div className="rich-text__toolbar__formatting-options-wrapper">
          <HeadingDropdown
            onToggle={this.toggleHeadingMenu}
            isToggleActive={true}
            isOpen={this.state.headingMenuOpen}
            onClose={this.closeHeadingMenu}
            change={props.change}
            disabled={props.disabled}>
            <Paragraph {...props} />
            <Visible if={isNodeTypeEnabled(field, BLOCKS.HEADING_1)}>
              <Heading1 {...props} extraClassNames="toolbar-h1-toggle" />
            </Visible>
            <Visible if={isNodeTypeEnabled(field, BLOCKS.HEADING_2)}>
              <Heading2 {...props} />
            </Visible>
            <Visible if={isNodeTypeEnabled(field, BLOCKS.HEADING_3)}>
              <Heading3 {...props} />
            </Visible>
            <Visible if={isNodeTypeEnabled(field, BLOCKS.HEADING_4)}>
              <Heading4 {...props} />
            </Visible>
            <Visible if={isNodeTypeEnabled(field, BLOCKS.HEADING_5)}>
              <Heading5 {...props} />
            </Visible>
            <Visible if={isNodeTypeEnabled(field, BLOCKS.HEADING_6)}>
              <Heading6 {...props} />
            </Visible>
          </HeadingDropdown>
          <Visible if={isAnyMarkEnabled}>
            <EditorToolbarDivider testId="mark-divider" />
          </Visible>
          <Visible if={isMarkEnabled(field, MARKS.BOLD)}>
            <Bold {...props} />
          </Visible>
          <Visible if={isMarkEnabled(field, MARKS.ITALIC)}>
            <Italic {...props} />
          </Visible>
          <Visible if={isMarkEnabled(field, MARKS.UNDERLINE)}>
            <Underlined {...props} />
          </Visible>
          <Visible if={isMarkEnabled(field, MARKS.CODE)}>
            <Code {...props} />
          </Visible>
          <Visible if={isAnyHyperlinkEnabled}>
            <EditorToolbarDivider testId="hyperlink-divider" />
            <Hyperlink {...props} />
          </Visible>
          <Visible if={isAnyListEnabled}>
            <EditorToolbarDivider testId="list-divider" />
          </Visible>
          <Visible if={isNodeTypeEnabled(field, BLOCKS.UL_LIST)}>
            <UnorderedList {...props} />
          </Visible>
          <Visible if={isNodeTypeEnabled(field, BLOCKS.OL_LIST)}>
            <OrderedList {...props} />
          </Visible>
          <Visible if={isNodeTypeEnabled(field, BLOCKS.QUOTE)}>
            <Quote {...props} />
          </Visible>
          <Visible if={isNodeTypeEnabled(field, BLOCKS.HR)}>
            <Hr {...props} />
          </Visible>
        </div>
        {this.renderEmbeds(props)}
      </EditorToolbar>
    );
  }
}
