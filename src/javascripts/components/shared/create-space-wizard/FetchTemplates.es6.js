import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import {getTemplatesList} from 'services/SpaceTemplateLoader';
import {RequestState} from './WizardUtils';

const FetchTemplates = createReactClass({
  propTypes: {
    // children is a rendering function
    children: PropTypes.func.isRequired
  },
  getInitialState () {
    return {
      templates: [],
      requestState: RequestState.PENDING
    };
  },
  componentDidMount () {
    this.fetch();
  },
  render () {
    return this.props.children(this.state);
  },
  async fetch () {
    try {
      const templatesList = await getTemplatesList();
      this.setState({
        templates: parseTemplates(templatesList),
        requestState: RequestState.SUCCESS,
        error: null
      });
    } catch (error) {
      this.setState({
        templates: [],
        requestState: RequestState.ERROR,
        error
      });
    }
  }
});

function parseTemplates (templates = []) {
  return templates.map(({fields, sys}) => ({...fields, id: sys.id}));
}

export default FetchTemplates;
