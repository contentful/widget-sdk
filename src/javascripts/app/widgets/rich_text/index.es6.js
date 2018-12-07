import withWidgetApi from 'app/widgets/WidgetApi/index.es6';
import RichTextEditor from './RichTextEditor.es6';
import withFeatureFlag from './withFeatureFlag.es6';
import withTracking from './withTracking.es6';
import withPublicationWarning from './WithPublicationWarning/index.es6';

export default withFeatureFlag(withWidgetApi(withPublicationWarning(withTracking(RichTextEditor))));
