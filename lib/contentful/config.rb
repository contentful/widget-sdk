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

    def delete(key)
      @data.delete(key)
    end

    def [](key)
      @data[key.to_sym]
    end

    def []=(key, value)
      @data[key.to_sym] = configurize_value(value)
    end

    def configurize_value(value)
      if value.class == Hash
        Config.new(value)
      elsif value.class == Array
        value.map{|v| configurize_value(v)}
      else
        value
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
