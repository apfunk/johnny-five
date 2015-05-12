var Board = require("../lib/board");
var Emitter = require("events").EventEmitter;
var util = require("util");
var priv = new Map();


function Base() {
  Emitter.call(this);

  this.HIGH = 1;
  this.LOW = 0;
  this.isReady = false;

  this.MODES = {};
  this.pins = [];
  this.analogPins = [];
}

util.inherits(Base, Emitter);

var Controllers = {
  // http://www.adafruit.com/datasheets/mcp23017.pdf
  MCP23017: {
    REGISTER: {
      value: {
        ADDRESS: 0x20,
        // IO A
        IODIRA: 0x00,
        GPPUA: 0x0C,
        GPIOA: 0x12,
        OLATA: 0x14,
        // IO B
        IODIRB: 0x01,
        GPPUB: 0x0D,
        GPIOB: 0x13,
        OLATB: 0x15,
      }
    },
    initialize: {
      value: function(opts) {
        var state = priv.get(this);

        state.iodir = [ 0xff, 0xff ];
        state.olat = [ 0xff, 0xff ];
        state.gpio = [ 0xff, 0xff ];
        state.gppu = [ 0x00, 0x00 ];

        this.address = opts.address || this.REGISTER.ADDRESS;

        this.io.i2cConfig();
        this.io.i2cWrite(this.address, [ this.REGISTER.IODIRA, state.iodir[this.REGISTER.IODIRA] ]);
        this.io.i2cWrite(this.address, [ this.REGISTER.IODIRB, state.iodir[this.REGISTER.IODIRB] ]);

        this.MODES.INPUT = this.io.MODES.INPUT;
        this.MODES.OUTPUT = this.io.MODES.OUTPUT;

        for (var i = 0; i < 16; i++) {
          this.pins.push({
            supportedModes: [
              this.io.MODES.INPUT,
              this.io.MODES.OUTPUT
            ],
            mode: 0,
            value: 0,
            report: 0,
            analogChannel: 127
          });

          this.pinMode(i, this.MODES.OUTPUT);
          this.digitalWrite(i, this.LOW);
        }

        this.name = "Expander:MCP23017";
        this.isReady = true;

        this.emit("connect");
        this.emit("ready");
      }
    },
    normalize: {
      value: function(pin) {
        return pin;
      }
    },
    // 1.6.1 I/O DIRECTION REGISTER
    pinMode: {
      value: function(pin, mode) {
        var state = priv.get(this);
        var pinIndex = pin;
        var port = 0;
        var iodir = null;

        if (pin < 8) {
          port = this.REGISTER.IODIRA;
        } else {
          port = this.REGISTER.IODIRB;
          pin -= 8;
        }

        iodir = state.iodir[port];

        if (mode === this.io.MODES.INPUT) {
          iodir |= 1 << pin;
        } else {
          iodir &= ~(1 << pin);
        }

        this.pins[pinIndex].mode = mode;
        this.io.i2cWrite(this.address, [ port, iodir ]);

        state.iodir[port] = iodir;
      }
    },
    // 1.6.10 PORT REGISTER
    digitalWrite: {
      value: function(pin, value) {
        var state = priv.get(this);
        var pinIndex = pin;
        var port = 0;
        var gpio = 0;
        // var olataddr = 0;
        var gpioaddr = 0;

        if (pin < 8) {
          port = this.REGISTER.IODIRA;
          // olataddr = this.REGISTER.OLATA;
          gpioaddr = this.REGISTER.GPIOA;
        } else {
          port = this.REGISTER.IODIRB;
          // olataddr = this.REGISTER.OLATB;
          gpioaddr = this.REGISTER.GPIOB;
          pin -= 8;
        }

        gpio = state.olat[port];

        if (value === this.io.HIGH) {
          gpio |= 1 << pin;
        } else {
          gpio &= ~(1 << pin);
        }

        this.pins[pinIndex].report = 0;
        this.pins[pinIndex].value = value;
        this.io.i2cWrite(this.address, [ gpioaddr, gpio ]);

        state.olat[port] = gpio;
        state.gpio[port] = gpio;
      }
    },
    // 1.6.7 PULL-UP RESISTOR
    // CONFIGURATION REGISTER
    pullUp: {
      value: function(pin, value) {
        var state = priv.get(this);
        var port = 0;
        var gppu = 0;
        var gppuaddr = 0;

        if (pin < 8) {
          port = this.REGISTER.IODIRA;
          gppuaddr = this.REGISTER.GPPUA;
        } else {
          port = this.REGISTER.IODIRB;
          gppuaddr = this.REGISTER.GPPUB;
          pin -= 8;
        }

        gppu = state.gppu[port];

        if (value === this.io.HIGH) {
          gppu |= 1 << pin;
        } else {
          gppu &= ~(1 << pin);
        }

        this.io.i2cWrite(this.address, [ gppuaddr, gppu ]);

        state.gppu[port] = gppu;
      }
    },
    digitalRead: {
      value: function(pin, callback) {
        var pinIndex = pin;
        var gpioaddr = 0;

        if (pin < 8) {
          gpioaddr = this.REGISTER.GPIOA;
        } else {
          gpioaddr = this.REGISTER.GPIOB;
          pin -= 8;
        }

        this.pins[pinIndex].report = 1;

        this.on("digital-read-" + pin, callback);

        this.io.i2cRead(this.address, gpioaddr, 1, function(data) {
          var byte = data[0];
          var value = byte >> pin & 0x01;

          this.pins[pinIndex].value = value;

          this.emit("digital-read-" + pin, value);
        }.bind(this));
      }
    },
    analogWrite: {
      value: function() {
        throw new Error("Expander:MCP23017 does not support analogWrite");
      }
    },
    analogRead: {
      value: function() {
        throw new Error("Expander:MCP23017 does not support analogRead");
      }
    },
    servoWrite: {
      value: function() {
        throw new Error("Expander:MCP23017 does not support servoWrite");
      }
    }
  },
  MCP23008: {
    REGISTER: {
      value: {
        ADDRESS: 0x20,
        IODIR: 0x00,
        GPPU: 0x06,
        GPIO: 0x09,
        OLAT: 0x0A,
      }
    },
    initialize: {
      value: function(opts) {
        var state = priv.get(this);

        state.iodir = [ 0xff ];
        state.olat = [ 0xff ];
        state.gpio = [ 0xff ];
        state.gppu = [ 0x00 ];

        this.address = opts.address || this.REGISTER.ADDRESS;

        this.io.i2cConfig();
        this.io.i2cWrite(this.address, [ this.REGISTER.IODIR, state.iodir[this.REGISTER.IODIR] ]);

        this.MODES.INPUT = this.io.MODES.INPUT;
        this.MODES.OUTPUT = this.io.MODES.OUTPUT;

        for (var i = 0; i < 8; i++) {
          this.pins.push({
            supportedModes: [
              this.io.MODES.INPUT,
              this.io.MODES.OUTPUT
            ],
            mode: 0,
            value: 0,
            report: 0,
            analogChannel: 127
          });

          this.pinMode(i, this.MODES.OUTPUT);
          this.digitalWrite(i, this.LOW);
        }

        this.name = "Expander:MCP23008";
        this.isReady = true;

        this.emit("connect");
        this.emit("ready");
      }
    },
    normalize: {
      value: function(pin) {
        return pin;
      }
    },
    // 1.6.1 I/O DIRECTION REGISTER
    pinMode: {
      value: function(pin, mode) {
        var state = priv.get(this);
        var pinIndex = pin;
        var port = this.REGISTER.IODIR;
        var iodir = state.iodir[port];

        if (mode === this.io.MODES.INPUT) {
          iodir |= 1 << pin;
        } else {
          iodir &= ~(1 << pin);
        }

        this.pins[pinIndex].mode = mode;
        this.io.i2cWrite(this.address, [ port, iodir ]);

        state.iodir[port] = iodir;
      }
    },
    // 1.6.10 PORT REGISTER
    digitalWrite: {
      value: function(pin, value) {
        var state = priv.get(this);
        var pinIndex = pin;
        var port = this.REGISTER.IODIR;
        var gpioaddr = this.REGISTER.GPIO;
        var gpio = state.olat[port];

        if (value === this.io.HIGH) {
          gpio |= 1 << pin;
        } else {
          gpio &= ~(1 << pin);
        }

        this.pins[pinIndex].report = 0;
        this.pins[pinIndex].value = value;
        this.io.i2cWrite(this.address, [ gpioaddr, gpio ]);

        state.olat[port] = gpio;
        state.gpio[port] = gpio;
      }
    },
    // 1.6.7 PULL-UP RESISTOR
    // CONFIGURATION REGISTER
    pullUp: {
      value: function(pin, value) {
        var state = priv.get(this);
        var port = this.REGISTER.IODIR;
        var gppuaddr = this.REGISTER.GPPU;
        var gppu = state.gppu[port];

        if (value === this.io.HIGH) {
          gppu |= 1 << pin;
        } else {
          gppu &= ~(1 << pin);
        }

        this.io.i2cWrite(this.address, [ gppuaddr, gppu ]);

        state.gppu[port] = gppu;
      }
    },
    digitalRead: {
      value: function(pin, callback) {
        var pinIndex = pin;
        var gpioaddr = this.REGISTER.GPIO;

        this.pins[pinIndex].report = 1;

        this.on("digital-read-" + pin, callback);

        this.io.i2cRead(this.address, gpioaddr, 1, function(data) {
          var byte = data[0];
          var value = byte >> pin & 0x01;

          this.pins[pinIndex].value = value;

          this.emit("digital-read-" + pin, value);
        }.bind(this));
      }
    },
    analogWrite: {
      value: function() {
        throw new Error("Expander:MCP23008 does not support analogWrite");
      }
    },
    analogRead: {
      value: function() {
        throw new Error("Expander:MCP23008 does not support analogRead");
      }
    },
    servoWrite: {
      value: function() {
        throw new Error("Expander:MCP23008 does not support servoWrite");
      }
    }
  }
};

function Expander(opts) {
  if (!(this instanceof Expander)) {
    return new Expander(opts);
  }

  Base.call(this);

  var controller = null;
  var state = {};

  Board.Component.call(
    this, opts = Board.Options(opts)
  );

  if (opts.controller && typeof opts.controller === "string") {
    controller = Controllers[opts.controller.toUpperCase()];
  } else {
    controller = opts.controller;
  }

  if (controller == null) {
    throw new Error("Expander expects a valid controller");
  }

  Object.defineProperties(this, controller);

  priv.set(this, state);

  if (typeof this.initialize === "function") {
    this.initialize(opts);
  }
}

util.inherits(Expander, Base);

module.exports = Expander;
