import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';

const Step1 = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired
  },
  render: function () {
    return h('h2', null, 'step 1');
  }
});

export default Step1;
