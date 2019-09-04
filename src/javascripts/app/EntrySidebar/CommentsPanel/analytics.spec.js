import * as Intercom from 'services/intercom.es6';
import { trackCommentCreated, trackIsCommentsAlphaEligible } from './analytics.es6';

describe('CommentsPanel/analytics', () => {
  beforeEach(() => {
    jest.spyOn(Intercom, 'trackEvent').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('trackCommentCreated()', () => {
    trackCommentCreated();
    expect(Intercom.trackEvent).toHaveBeenCalledTimes(1);
    expect(Intercom.trackEvent).toHaveBeenCalledWith('feature-comments-comment-created');
    trackCommentCreated();
    expect(Intercom.trackEvent).toHaveBeenCalledTimes(2);
  });

  describe('trackIsCommentsAlphaEligible()', () => {
    it('calls intercom only once after Intercom is enabled', () => {
      Intercom.isEnabled = () => false;
      trackIsCommentsAlphaEligible();

      expect(Intercom.trackEvent).toHaveBeenCalledTimes(0);

      Intercom.isEnabled = () => true;
      trackIsCommentsAlphaEligible();
      trackIsCommentsAlphaEligible();

      expect(Intercom.trackEvent).toHaveBeenCalledTimes(1);
      expect(Intercom.trackEvent).toHaveBeenCalledWith('feature-comments-is-alpha-eligible');
    });
  });
});
