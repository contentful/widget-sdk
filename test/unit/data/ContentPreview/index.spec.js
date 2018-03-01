import * as sinon from 'helpers/sinon';

fdescribe('data/ContentPreview', function () {
  beforeEach(function () {
    this.environment = {
      env: 'production'
    };
    module('contentful/test', $provide => {
      $provide.value('Config', this.environment);
    });
    const {
      hasTEAContentPreviews,
      hasHighlightedCourseCT,
      isExampleSpace
    } = this.$inject('data/ContentPreview');
    this.hasTEAContentPreviews = hasTEAContentPreviews;
    this.hasHighlightedCourseCT = hasHighlightedCourseCT;
    this.isExampleSpace = isExampleSpace;
  });

  describe('#hasTEAContentPreviews', function () {
    it('should return false if there are no content previews', function () {
      expect(this.hasTEAContentPreviews()).toEqual(false);
      expect(this.hasTEAContentPreviews({})).toEqual(false);
    });
    it('should return false if no content previews use TEA suite', function () {
      expect(this.hasTEAContentPreviews({
        test: {
          configurations: [
            { url: 'https://google.com' },
            { url: 'http://the-example-app-nodejs.quirely.com' }
          ]
        }
      })).toEqual(false);
    });
    fit('should return true if there is atleast one content preview that uses an example app from the TEA suite', function () {
      expect(this.hasTEAContentPreviews({
        test: {
          configurations: [
            { url: 'https://google.com' },
            { url: 'http://the-example-app-nodejs.contentful.com' }
          ]
        }
      })).toEqual(true);

      this.environment = {
        env: 'staging'
      }
      this.$apply();
      expect(this.hasTEAContentPreviews({
        test: {
          configurations: [
            { url: 'http://the-example-app-nodejs.flinkly.com' }
          ]
        }
      })).toEqual(true);
    });
  });
});
