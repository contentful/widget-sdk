import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {asReact} from 'ui/Framework/DOMRenderer';
import CheckmarkIcon from 'svg/checkmark';
import ContentTypeIcon from 'svg/page-ct';
import ContentIcon from 'svg/page-content';
import MediaIcon from 'svg/page-media';
import APIsIcon from 'svg/page-apis';

const infoItems = [
  {
    icon: ContentTypeIcon,
    title: 'Content model',
    description: 'The content model is comprised of content types, they work like a stencil which defines the structure of entries. We’re creating a few different content types for you to see how it works.'
  }, {
    icon: ContentIcon,
    title: 'Content',
    description: 'Your content is made up of entries. The space will include a couple of entries based on the content types mentioned above.'
  }, {
    icon: MediaIcon,
    title: 'Media',
    description: 'Your media consists of assets, which are external files, from images or videos to documents. Your entries will have a few assets to complement them.'
  }, {
    icon: APIsIcon,
    title: 'API keys',
    description: 'An API key is the token that you’ll use to retrieve your content. We created a few API keys so that you can get started fetching your content right away.'
  }
];

const ProgressScreen = createReactClass({
  propTypes: {
    done: PropTypes.bool.isRequired,
    confirm: PropTypes.func.isRequired
  },
  render: function () {
    const {done, confirm} = this.props;

    return h('div', null,
      h('div', {className: 'modal-dialog__content'},
        h('div', {className: 'create-new-space__templates__status'},
          !done && h('div', {className: 'spinner'}),
          done && h('div', {style: {transform: 'scale(2)'}}, asReact(CheckmarkIcon))
        ),
        h('h2', {className: 'create-space-wizard-dialog__heading'},
          'Hang on, we’re preparing your space'
        ),
        h('p', {className: 'create-new-space-dialog__subheading'},
          'In the meantime, let us quickly explain the kind of things you’ll find in your space'
        ),
        h('div', {className: 'create-new-space__templates__entities'},
          infoItems.map(({icon, title, description}) => h('div', {
            key: title,
            className: 'create-new-space__templates__entity'
          },
            h('div', null, asReact(icon)),
            h('div', {className: 'create-new-space__templates__entity__description'},
              h('h3', null, title),
              h('p', null, description)
            )
          ))
        )
      ),
      h('div', {style: {textAlign: 'center'}},
        h('button', {
          className: 'btn-action',
          'data-test-id': 'get-started',
          disabled: !done,
          onClick: confirm
        }, 'Get started')
      )
    );
  }
});

export default ProgressScreen;
