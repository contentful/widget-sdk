describe('data/ContentPreview', function () {
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
    it('should return true if there is atleast one content preview that uses an example app from the TEA suite', function () {
      expect(this.hasTEAContentPreviews({
        test: {
          configurations: [
            { url: 'https://google.com' },
            { url: 'http://the-example-app-nodejs.contentful.com' }
          ]
        }
      })).toEqual(true);
    });
  });

  describe('#hasHighlightedCourseCT', function () {
    it('should return false when there are no content types with id `layoutHighlightedCourse`', function () {
      expect(this.hasHighlightedCourseCT([])).toEqual(false);
      expect(this.hasHighlightedCourseCT([{
        sys: {
          id: 1
        }
      }])).toEqual(false);
    });
    it('should return true when there is a content type with the id `layoutHighlightedCourse`', function () {
      expect(this.hasHighlightedCourseCT([{
        sys: {id: 'layoutHighlightedCourse'}
      }])).toEqual(true);
    });
  });
});
