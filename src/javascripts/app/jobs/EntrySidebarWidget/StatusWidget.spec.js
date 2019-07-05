import StatusWidget from './StatusWidget.es6';
import {
  createPublicationWidgetTest,
  createCommands,
  DEFAULT_TEST_PROPS,
  expectPrimaryButton
} from '../../EntrySidebar/PublicationWidget/__test__/PublicationWidgetTest.es6';

describe(
  'app/jobs/StatusWidget',
  createPublicationWidgetTest({
    component: StatusWidget,
    componentDefaultProps: {
      ...DEFAULT_TEST_PROPS,
      isSaving: false,
      isDisabled: false,
      isScheduledPublishDisabled: false,
      onScheduledPublishClick: jest.fn()
    },
    customTests: describeStatusWidgetSpecifics
  })
);

function describeStatusWidgetSpecifics(render) {
  let commands;

  beforeEach(() => {
    commands = createCommands();
  });

  describe('`isDisabled` prop', () => {
    it('overrules enabled primary command', () => {
      const { wrapper } = render({
        isDisabled: true,
        primary: commands.enabled
      });
      expectPrimaryButton(wrapper, { isDisabled: true });
    });

    it('does not overrules disabled primary command', () => {
      const { wrapper } = render({
        isDisabled: false,
        primary: commands.disabled
      });
      expectPrimaryButton(wrapper, { isDisabled: true });
    });

    // TODO: Test more StatusWidget specifics.
  });
}
