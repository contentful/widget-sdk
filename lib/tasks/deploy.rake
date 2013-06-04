namespace :generate do
  task :all => [:index_page, :css_redirect]

  task :index_page => :environment do
    require 'rails/console/app'
    require 'rails/console/helpers'
    include Rails::ConsoleMethods # required in 3.2

    puts "* Generating index page *"
    response = app.get("/")
    if response == 200
      File.open("#{Rails.public_path}/index.html", "w") do |f|
        f.write(app.response.body)
      end
    else
      raise "Error generating index page #{response.inspect}"
    end
  end

  task :css_redirect => :environment do
    path = File.join(Rails.root, "public/app/manifest.yml")
    filename = YAML::load(File.open(path))["application.css"]

    AssetSync.storage.space.files.create({
      :key => "app/application.css",
      :public => true,
      :acl => 'public-read',
      :body => '',
      'x-amz-website-redirect-location' => "/app/#{filename}"
    })
  end
end
