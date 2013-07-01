module Contentful

  class << self
    def config
      @config ||= Contentful::Config.load(File.join(Rails.root, "config", "environments", Rails.env, "config.json"))
    end

    def ui_config
      unless @ui_config
        @ui_config = Contentful::Config.load(File.join(Rails.root, "config", "environments", Rails.env, "config.json"))
        @ui_config.delete('fog')
      end
      @ui_config
    end
  end

end
