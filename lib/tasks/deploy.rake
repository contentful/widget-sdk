namespace :generate do
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
end
