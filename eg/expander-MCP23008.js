var five = require("../lib/johnny-five.js");
var board = new five.Board();

board.on("ready", function() {
  var expander = new five.Expander({
    controller: "MCP23008"
  });

  var virtual = new five.Board.Virtual({
    io: expander
  });

  var leds = [];

  for (var i = 0; i < 8; i++) {
    leds.push(new five.Led({ pin: i, board: virtual }));
  }

  leds = new five.Leds(leds);
  leds.on();
});
