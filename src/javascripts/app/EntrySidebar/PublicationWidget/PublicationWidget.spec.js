import PublicationWidget from './PublicationWidget.es6';
import { createPublicationWidgetTest } from './__test__/PublicationWidgetTest.es6';

describe(
  'app/EntrySidebar/PublicationWidget',
  createPublicationWidgetTest({
    component: PublicationWidget
  })
);
