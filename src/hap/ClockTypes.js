'use strict';

var inherits = require('util').inherits;

module.exports = {
  registerWith: function (hap) {

    const Characteristic = hap.Characteristic;
    const Service = hap.Service;

    ///////////////////////////////////////////////////////////////////////////////////////////
    // Clock: Hour
    ///////////////////////////////////////////////////////////////////////////////////////////
    Characteristic.ClockHour = function () {
      Characteristic.call(this, 'Hour', Characteristic.ClockHour.UUID);

      this.setProps({
        format: Characteristic.Formats.INT,
        minValue: 0,
        maxValue: 23,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE],
      });

      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.ClockHour, Characteristic);
    Characteristic.ClockHour.UUID = 'B534E0E3-2CB9-4A66-9353-EC886C949485';

    ///////////////////////////////////////////////////////////////////////////////////////////
    // Clock: Minute
    ///////////////////////////////////////////////////////////////////////////////////////////
    Characteristic.ClockMinute = function () {
      Characteristic.call(this, 'Minute', Characteristic.ClockMinute.UUID);

      this.setProps({
        format: Characteristic.Formats.INT,
        minValue: 0,
        maxValue: 59,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE],
      });

      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.ClockMinute, Characteristic);
    Characteristic.ClockMinute.UUID = '9DD407F8-C090-4D57-9305-03F0679897B3';


    Service.Clock = function (displayName, subtype) {
      Service.call(this, displayName, Service.Clock.UUID, subtype);

      // Required Characteristics
      this.addCharacteristic(Characteristic.ClockHour);
      this.addCharacteristic(Characteristic.ClockMinute);
    };
    inherits(Service.Clock, Service);
    Service.Clock.UUID = '4FA3884A-D165-4248-8D0B-850F6086DDD4';
  }
};
