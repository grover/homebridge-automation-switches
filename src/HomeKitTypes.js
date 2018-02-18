"use strict";

var inherits = require('util').inherits;

module.exports = {
  registerWith: function (hap) {

    const Characteristic = hap.Characteristic;
    const Service = hap.Service;


    Characteristic.AutomaticOff = function () {
      Characteristic.call(this, 'Automatic Off', '72227266-CA42-4442-AB84-0A7D55A0F08D');

      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE],
      });

      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.AutomaticOff, Characteristic);
    Characteristic.AutomaticOff.UUID = '72227266-CA42-4442-AB84-0A7D55A0F08D';

    Characteristic.PeriodInSeconds = function () {
      Characteristic.call(this, 'Period', 'B469181F-D796-46B4-8D99-5FBE4BA9DC9C');

      this.setProps({
        format: Characteristic.Formats.INT,
        unit: Characteristic.Units.SECONDS,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE],
        minValue: 1,
        maxValue: 3600,
      });

      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.PeriodInSeconds, Characteristic);
    Characteristic.PeriodInSeconds.UUID = 'B469181F-D796-46B4-8D99-5FBE4BA9DC9C';

    Service.SwitchProgram = function (displayName, subtype) {
      Service.call(this, displayName, 'FD92B7CF-A343-4D7E-9467-FD251E22C374', subtype);

      // Required Characteristics
      this.addCharacteristic(Characteristic.PeriodInSeconds);
      this.addCharacteristic(Characteristic.AutomaticOff);
    };
    inherits(Service.SwitchProgram, Service);
    Service.SwitchProgram.UUID = 'FD92B7CF-A343-4D7E-9467-FD251E22C374';
  }
}