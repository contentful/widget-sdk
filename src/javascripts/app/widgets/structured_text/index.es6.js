import connectToWidgetAPI from '../WidgetApi/index.es6';
import StructuredTextEditor from './StructuredTextEditor.es6';
import withFeatureFlag from './withFeatureFlag.es6';

export default withFeatureFlag(connectToWidgetAPI(StructuredTextEditor));
