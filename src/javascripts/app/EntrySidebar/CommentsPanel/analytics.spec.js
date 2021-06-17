import * as Intercom from 'services/intercom';
import { trackCommentCreated } from './analytics';

describe('CommentsPanel/analytics', () => {
  beforeEach(() => {
    jest.spyOn(Intercom, 'trackEvent').mockImplementation(() => {});
  });

  it('trackCommentCreated()', () => {
    trackCommentCreated();
    expect(Intercom.trackEvent).toHaveBeenCalledTimes(1);
    expect(Intercom.trackEvent).toHaveBeenCalledWith('feature-comments-comment-created');
    trackCommentCreated();
    expect(Intercom.trackEvent).toHaveBeenCalledTimes(2);
  });
});
