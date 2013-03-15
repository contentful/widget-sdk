module Contentful
  class Config
    class << self
      def load(filename)
        new(JSON.parse(IO.read(filename)))
      end
    end

    def initialize(data={})
      @data = {}.with_indifferent_access
      update!(data)
    end

    def update!(data)
      data.each do |key, value|
        self[key] = value
      end
    end

    def [](key)
      @data[key.to_sym]
    end

    def []=(key, value)
      if value.class == Hash
        @data[key.to_sym] = Config.new(value)
      else
        @data[key.to_sym] = value
      end
    end

    def to_hash
      @data
    end

    def to_symbolized_hash
      hash = {}
      @data.each{|k, v| hash[k.to_sym] = v}
      hash
    end

    def method_missing(sym, *args)
      if sym.to_s =~ /(.+)=$/
        self[$1] = args.first
      else
        self[sym]
      end
    end

  end
end
