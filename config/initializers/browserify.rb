require 'tilt_commonjs'
Contentful::Application.assets.register_postprocessor 'application/javascript', Tilt::CommonJSTemplate if Contentful::Application.assets
