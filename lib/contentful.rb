module Contentful

  class << self
    def config
      @config ||= Contentful::Config.load(File.join(Rails.root, "config", "environments", Rails.env, "config.json"))
    end
  end

end
