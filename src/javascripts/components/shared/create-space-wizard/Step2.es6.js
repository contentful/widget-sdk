import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';

const Step2 = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired
  },
  render: function () {
    return h('h2', null, 'step 2');
  }
});

export default Step2;
