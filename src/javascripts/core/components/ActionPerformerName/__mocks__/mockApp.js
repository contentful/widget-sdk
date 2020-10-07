export const mockApp = {
  namespace: 'app',
  id: '12345678imeB4WyeUjTKSw',
  slug: '12345678imeB4WyeUjTKSw',
  iconUrl:
    '//images.ctfassets.net/lpjm8d10rkpy/4zI9Kh5oRtahqJockE56KG/9948001e84714b7089a60457891b1722/app-icon.svg',
  name: 'App Name',
  hosting: { type: 'src', value: 'https://contentful-daily-animal.glitch.me' },
  parameters: {
    definitions: { instance: [{ name: 'hey', type: 'Symbol', id: 'yo' }], installation: [] },
    values: {
      installation: {
        bynderURL: 'https://contentful.getbynder.com/',
        assetTypes: 'image,audio,document,video',
      },
    },
  },
  locations: [
    { location: 'entry-field', fieldTypes: [{ type: 'Symbol' }] },
    { location: 'entry-editor' },
    { location: 'entry-sidebar' },
    { location: 'dialog' },
  ],
};
