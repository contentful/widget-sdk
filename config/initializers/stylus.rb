require 'stylus'

# Import plugins directly from Node.js, like nib.
Stylus.use :nib

# Enable debug info, which sends the 'linenos' and 'firebug' options to Stylus.
# If you provide a raw content String to the `Stylus.compile` method, remember to send
# a `:filename` option so Stylus can locate your stylesheet for proper inspection.
if Rails.env.development?
  Stylus.debug = true
end
