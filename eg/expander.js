var five = require("../lib/johnny-five.js");
var board = new five.Board();

board.on("ready", function() {

  // Bricktronics
  var en = 79;
  var pwm = 10;
  var dir = 78;

  var expander = new five.Expander({
    controller: "MCP23017"
  });

  var virtual = new five.Board.Virtual({
    io: expander
  });

  // var a = new five.Led({
  //   pin: 0,
  //   board: virtual
  // });

console.log(expander.normalize);
  var b = new five.Led({
    pin: 15,
    board: virtual
  });

  // a.blink();
  b.blink();
  // led.blink();


  // this.repl.inject({
  //   ex: expander
  // });


  // // for (var i = 0; i < 16; i++) {
  // //   expander.pinMode(i, 1);
  // //   expander.digitalWrite(i, 1);
  // // }



  // expander.pinMode(0, 1);
  // expander.pinMode(8, 1);

  // expander.digitalWrite(0, 0);
  // expander.digitalWrite(8, 0);

  // expander.pinMode(7, 0);

  // expander.digitalRead(7, function(data) {
  //   console.log(data);

  // });


  // expander.pinMode(en, this.MODES.OUTPUT);
  // expander.pinMode(pwm, this.MODES.OUTPUT);
  // expander.pinMode(dir, this.MODES.OUTPUT);


  // expander.digitalWrite(dir, this.MODES.LOW);
  // expander.analogWrite(pwm, 255);
  // expander.digitalWrite(en, this.MODES.HIGH);


  // setTimeout(function() {

  //   expander.digitalWrite(en, this.MODES.LOW);
  //   expander.analogWrite(pwm, 0);
  //   expander.digitalWrite(dir, this.MODES.LOW);

  //   setTimeout(function() {

  //     expander.digitalWrite(dir, this.MODES.LOW);
  //     expander.analogWrite(pwm, 255);
  //     expander.digitalWrite(en, this.MODES.HIGH);
  //   }.bind(this), 2000);

  // }.bind(this), 2000);

});
