import { fireEvent } from '@testing-library/react';
import { forEach, mapValues } from 'lodash';
import StatusWidget from './StatusWidget.es6';
import {
  createPublicationWidgetTest,
  createCommands,
  TEST_IDS as COMMON_TEST_IDS,
  DEFAULT_TEST_PROPS,
  expectPrimaryButton
} from '../../EntrySidebar/PublicationWidget/__test__/PublicationWidgetTest.es6';

const TEST_IDS = {
  ...COMMON_TEST_IDS,
  scheduleAction: 'schedule-publication'
};
const select = mapValues(TEST_IDS, testId => elem => elem.queryByTestId(testId));

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
      const primary = commands.disabled;
      const { wrapper } = render({
        isDisabled: false,
        primary
      });
      expectPrimaryButton(wrapper, primary, { isDisabled: true });
    });
  });

  describe('schedule button', () => {
    const scheduleActionShownByStatus = {
      draft: true,
      changes: true,
      archived: false,
      published: false
    };

    forEach(scheduleActionShownByStatus, (expectIsShown, status) => {
      it(`is ${expectIsShown ? '' : 'not '}shown on status "${status}"`, () => {
        const { wrapper } = render({ status });

        expectScheduleActionIsShown(wrapper, false);
        fireEvent.click(select.secondaryActionsDropdown(wrapper));
        expectScheduleActionIsShown(wrapper, expectIsShown);
      });
    });

    function expectScheduleActionIsShown(wrapper, expectIsShown) {
      expectIsShown
        ? expect(select.scheduleAction(wrapper)).toBeInTheDocument()
        : expect(select.scheduleAction(wrapper)).not.toBeInTheDocument();
    }
  });
}
