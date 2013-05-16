#Use this file to set/override Jasmine configuration options
#You can remove it if you don't need it.
#This file is loaded *after* jasmine.yml is interpreted.
#
#Example: using a different boot file.
Jasmine.configure do |config|
   #@config.boot_dir = '/absolute/path/to/boot_dir'
   #@config.boot_files = lambda { ['/absolute/path/to/boot_dir/file.js'] }
   #@config.src_path = 
   config.add_rack_path('/app', lambda {
     # In order to have asset helpers like asset_path and image_path, we need to require 'action_view/base'.  This
     # triggers run_load_hooks on action_view which, in turn, causes sprockets/railtie to load the Sprockets asset
     # helpers.  Alternatively, you can include the helpers yourself without loading action_view/base:
     Rails.application.assets.context_class.instance_eval do
       include ::Sprockets::Helpers::IsolatedHelper
       include ::Sprockets::Helpers::RailsHelper
     end
     Rails.application.assets
   })
end


