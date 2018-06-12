describe('cfDeveloperResources directive', () => {
  beforeEach(function () {
    module('contentful/test');

    const element = this.$compile('<cf-developer-resources />', {
      context: {}
    });
    this.controller = element.isolateScope().resources;
    this.$inject('$rootScope').$digest();
  });

  it('JavaScript is selected by default', function () {
    expect(this.controller.selected).toBe('JavaScript');
    expect(this.controller.languageResources.examples[0].name).toBe('Discovery app');
  });

  it('shows selected language', function () {
    this.controller.selectLanguage('PHP');
    expect(this.controller.selected).toBe('PHP');
    expect(this.controller.languageResources.examples[0].name).toBe('Symfony');
  });
});
