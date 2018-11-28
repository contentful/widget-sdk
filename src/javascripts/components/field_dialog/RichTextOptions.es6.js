import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { ToggleButton, TextLink } from '@contentful/forma-36-react-components';
import { BLOCKS, MARKS, INLINES } from '@contentful/rich-text-types';
import ValidationType, {
  VALIDATABLE_NODE_TYPES,
  VALIDATABLE_MARKS
} from './RichTextValidationType.es6';

const RichTextOptionsSection = ({ children, heading, actions }) => (
  <div className="rich-text-options__section">
    <div className="rich-text-options__section__header">
      <h3>{heading}</h3>
      {actions && actions}
    </div>
    <div className="rich-text-options__section__inner-wrapper">{children}</div>
  </div>
);

RichTextOptionsSection.propTypes = {
  children: PropTypes.node.isRequired,
  heading: PropTypes.string.isRequired,
  actions: PropTypes.node
};

RichTextOptionsSection.defaultProps = {
  actions: undefined
};

const ValidatableTypes = {
  [ValidationType.ENABLED_NODE_TYPES]: VALIDATABLE_NODE_TYPES,
  [ValidationType.ENABLED_MARKS]: VALIDATABLE_MARKS
};

/**
 * This component is responsible for controlling
 * the formatting options for the Structured text field.
 *
 * Both enabledMarks and enabledNodeTypes can have following values:
 * - undefined -- equivalent to enabling everything.
 * This is done to avoid sending any validation objects to the API.
 * - [] (empty array) -- nothing is enabled
 * - {Array} -- some features enabled
 */
class RichTextOptions extends Component {
  static propTypes = {
    enabledMarks: PropTypes.arrayOf(PropTypes.string),
    enabledNodeTypes: PropTypes.arrayOf(PropTypes.string),
    /**
     * Gets called when the user interacts with the form
     *
     * @param {{enabledMarks?: [], enabledNodeTypes?: []}} enabled marks and node types
     */
    onChange: PropTypes.func
  };

  state = {
    enabledNodeTypes: this.props.enabledNodeTypes,
    enabledMarks: this.props.enabledMarks
  };

  options = {
    headingOptions: Array.from(Array(6).keys()).map((_, index) => ({
      id: BLOCKS[`HEADING_${index + 1}`],
      title: `H${index + 1}`,
      validationOf: ValidationType.ENABLED_NODE_TYPES
    })),
    formattingOptions: [
      {
        icon: 'FormatBoldTrimmed',
        id: MARKS.BOLD,
        validationOf: ValidationType.ENABLED_MARKS
      },
      {
        icon: 'FormatItalicTrimmed',
        id: MARKS.ITALIC,
        validationOf: ValidationType.ENABLED_MARKS
      },
      {
        icon: 'FormatUnderlinedTrimmed',
        id: MARKS.UNDERLINE,
        validationOf: ValidationType.ENABLED_MARKS
      },
      {
        icon: 'CodeTrimmed',
        id: MARKS.CODE,
        validationOf: ValidationType.ENABLED_MARKS
      },
      {
        icon: 'ListBulletedTrimmed',
        id: BLOCKS.UL_LIST,
        validationOf: ValidationType.ENABLED_NODE_TYPES
      },
      {
        icon: 'ListNumberedTrimmed',
        id: BLOCKS.OL_LIST,
        validationOf: ValidationType.ENABLED_NODE_TYPES
      },
      {
        icon: 'QuoteTrimmed',
        id: BLOCKS.QUOTE,
        validationOf: ValidationType.ENABLED_NODE_TYPES
      },
      {
        icon: 'HorizontalRuleTrimmed',
        id: BLOCKS.HR,
        validationOf: ValidationType.ENABLED_NODE_TYPES
      }
    ],
    linkOptions: [
      {
        icon: 'ExternalLinkTrimmed',
        title: 'Link to URL',
        id: INLINES.HYPERLINK,
        validationOf: ValidationType.ENABLED_NODE_TYPES
      },
      {
        icon: 'EntryTrimmed',
        title: 'Link to entry',
        id: INLINES.ENTRY_HYPERLINK,
        validationOf: ValidationType.ENABLED_NODE_TYPES
      },
      {
        icon: 'AssetTrimmed',
        title: 'Link to asset',
        id: INLINES.ASSET_HYPERLINK,
        validationOf: ValidationType.ENABLED_NODE_TYPES
      }
    ],
    entryOptions: [
      {
        icon: 'EmbeddedEntryBlock',
        title: 'Entry',
        id: BLOCKS.EMBEDDED_ENTRY,
        validationOf: ValidationType.ENABLED_NODE_TYPES
      },
      {
        icon: 'EmbeddedEntryInline',
        title: 'Inline entry',
        id: INLINES.EMBEDDED_ENTRY,
        validationOf: ValidationType.ENABLED_NODE_TYPES
      },
      {
        icon: 'AssetTrimmed',
        title: 'Asset',
        id: BLOCKS.EMBEDDED_ASSET,
        validationOf: ValidationType.ENABLED_NODE_TYPES
      }
    ]
  };

  toggleOption = option => {
    let newState;
    const currentValue = this.state[option.validationOf];
    const isActive = _.includes(currentValue, option.id);
    const isEveryOptionActive = currentValue === undefined;

    if (isEveryOptionActive) {
      newState = {
        [option.validationOf]: ValidatableTypes[option.validationOf].filter(id => id !== option.id)
      };
    } else if (isActive) {
      newState = {
        [option.validationOf]: currentValue.filter(id => id !== option.id)
      };
    } else {
      newState = {
        [option.validationOf]: [...currentValue, option.id]
      };
    }

    // If every option of type is active
    // we set value of enabled options to undefined
    const isEveryOptionOfTypeActive = ValidatableTypes[option.validationOf].every(type =>
      newState[option.validationOf].includes(type)
    );
    if (isEveryOptionOfTypeActive) {
      newState[option.validationOf] = undefined;
    }

    this.setState(newState, () => {
      this.props.onChange(this.state);
    });
  };

  isOptionActive = option => {
    if (this.state[option.validationOf] === undefined) {
      return true;
    }
    return this.state[option.validationOf].includes(option.id);
  };

  isEveryOptionActive = () => {
    return (
      this.state[ValidationType.ENABLED_MARKS] === undefined &&
      this.state[ValidationType.ENABLED_NODE_TYPES] === undefined
    );
  };

  toggleAll = () => {
    let newState;
    if (this.isEveryOptionActive()) {
      newState = {
        [ValidationType.ENABLED_MARKS]: [],
        [ValidationType.ENABLED_NODE_TYPES]: []
      };
    } else {
      newState = {
        [ValidationType.ENABLED_MARKS]: undefined,
        [ValidationType.ENABLED_NODE_TYPES]: undefined
      };
    }
    this.setState(newState, () => {
      this.props.onChange(this.state);
    });
  };

  renderToggles = (options, className) =>
    options.map(option => (
      <ToggleButton
        extraClassNames={`rich-text-option-toggle ${className}`}
        testId={`toggle-button-${option.id}`}
        key={option.id + this.isOptionActive(option)}
        icon={option.icon}
        onToggle={() => this.toggleOption(option)}
        title={option.title}
        isActive={this.isOptionActive(option)}>
        {option.title ? option.title : ''}
      </ToggleButton>
    ));

  render() {
    return (
      <div className="rich-text-options" data-test-id="structured-text-options">
        <RichTextOptionsSection
          heading="Formatting options"
          actions={
            <TextLink onClick={() => this.toggleAll()} testId="toggle-all-link">
              {this.isEveryOptionActive() ? 'Disable all' : 'Enable all'}
            </TextLink>
          }>
          {this.renderToggles(this.options.headingOptions)}
          {this.renderToggles(this.options.formattingOptions, 'toggle-square')}
        </RichTextOptionsSection>
        <RichTextOptionsSection heading="Hyperlinks">
          {this.renderToggles(this.options.linkOptions)}
        </RichTextOptionsSection>
        <RichTextOptionsSection heading="Embedded entries & assets">
          {this.renderToggles(this.options.entryOptions)}
        </RichTextOptionsSection>
      </div>
    );
  }
}

export default RichTextOptions;
