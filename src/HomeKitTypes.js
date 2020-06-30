'use strict';

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

    Characteristic.SignalMotionOnActivation = function () {
      Characteristic.call(this, 'Signal Motion on Activation', '1BA034D5-5882-44E5-9C70-606D590DE42E');

      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE],
      });

      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.SignalMotionOnActivation, Characteristic);
    Characteristic.SignalMotionOnActivation.UUID = '1BA034D5-5882-44E5-9C70-606D590DE42E';

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
      this.addCharacteristic(Characteristic.SignalMotionOnActivation);
    };
    inherits(Service.SwitchProgram, Service);
    Service.SwitchProgram.UUID = 'FD92B7CF-A343-4D7E-9467-FD251E22C374';

    /******************************************************
     * Slider switch
     */

    Characteristic.SliderValue = function () {
      Characteristic.call(this, 'Value', '38AFD9A5-A0C5-42D9-ACD0-1BE08D4FF3F7');

      this.setProps({
        format: Characteristic.Formats.INT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE],
      });

      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.SliderValue, Characteristic);
    Characteristic.SliderValue.UUID = '38AFD9A5-A0C5-42D9-ACD0-1BE08D4FF3F7';


    Service.Slider = function (displayName, subtype) {
      Service.call(this, displayName, 'DDFC25B3-3624-44CA-9477-FDC977FC7C81', subtype);

      // Required Characteristics
      this.addCharacteristic(Characteristic.SliderValue);
    };
    inherits(Service.Slider, Service);
    Service.Slider.UUID = 'DDFC25B3-3624-44CA-9477-FDC977FC7C81';
  }
};