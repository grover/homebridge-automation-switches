'use strict';

var inherits = require('util').inherits;

module.exports = {
  registerWith: function (hap) {

    const Characteristic = hap.Characteristic;
    const Service = hap.Service;

    ///////////////////////////////////////////////////////////////////////////////////////////
    // Solar: Latitude
    ///////////////////////////////////////////////////////////////////////////////////////////
    Characteristic.SolarLatitude = function () {
      Characteristic.call(this, 'Latitude', Characteristic.SolarLatitude.UUID);

      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: Characteristic.Units.ARC_DEGREE,
        minValue: -90,
        maxValue: 90,
        minStep: 0.000001,
        perms: [Characteristic.Perms.READ],
      });

      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.SolarLatitude, Characteristic);
    Characteristic.SolarLatitude.UUID = '6FE198BF-29F2-493F-8B27-B60FE795C3A3';

    ///////////////////////////////////////////////////////////////////////////////////////////
    // Solar: Longitude
    ///////////////////////////////////////////////////////////////////////////////////////////
    Characteristic.SolarLongitude = function () {
      Characteristic.call(this, 'Longitude', Characteristic.SolarLongitude.UUID);

      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: Characteristic.Units.ARC_DEGREE,
        minValue: -180,
        maxValue: 180,
        minStep: 0.000001,
        perms: [Characteristic.Perms.READ],
      });

      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.SolarLongitude, Characteristic);
    Characteristic.SolarLongitude.UUID = '9611DA9C-8F1A-4B23-A391-0973B7A9039D';

    ///////////////////////////////////////////////////////////////////////////////////////////
    // Solar: MinutesOffset
    ///////////////////////////////////////////////////////////////////////////////////////////
    Characteristic.SolarMinutesOffset = function () {
      Characteristic.call(this, 'Offset', Characteristic.SolarMinutesOffset.UUID);

      this.setProps({
        format: Characteristic.Formats.INT,
        unit: 'mins',
        minValue: -15,
        maxValue: 15,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE],
      });

      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.SolarMinutesOffset, Characteristic);
    Characteristic.SolarMinutesOffset.UUID = '09147249-07BC-4DB4-B916-31B77CD6EE13';


    ///////////////////////////////////////////////////////////////////////////////////////////
    // constants taken from https://github.com/kcharwood/homebridge-suncalc
    ///////////////////////////////////////////////////////////////////////////////////////////

    const SolarPeriods = [ 'Night', 'Morning Twilight', 'Sunrise', 'Daytime', 'Sunset', 'Evening Twilight' ];

    ///////////////////////////////////////////////////////////////////////////////////////////
    // Solar: Period
    ///////////////////////////////////////////////////////////////////////////////////////////
    Characteristic.SolarPeriod = function () {
      Characteristic.call(this, 'Period', Characteristic.SolarPeriod.UUID);

      this.setProps({
        format: Characteristic.Formats.UINT8,
        minValue: 0,
        maxValue: SolarPeriods.length - 1,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY],
      });

      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.SolarPeriod, Characteristic);
    Characteristic.SolarPeriod.UUID = '4D640A06-34FE-45D7-BF7C-736BB2CF5693';
    Characteristic.SolarPeriod._SolarPeriods = SolarPeriods;
    Characteristic.SolarPeriod._SolarTimes = [ 'night', 'dawn', 'sunrise', 'sunriseEnd', 'sunsetStart', 'sunset' ];


    Service.Solar = function (displayName, subtype) {
      Service.call(this, displayName, Service.Solar.UUID, subtype);

      // Required Characteristics
      this.addCharacteristic(Characteristic.SolarPeriod);
      this.addCharacteristic(Characteristic.SolarMinutesOffset);
    };
    inherits(Service.Solar, Service);
    Service.Solar.UUID = 'F9305C45-DBC5-4BD1-B4DA-C67A495288CD';

    Service.SolarLocation = function (displayName, subtype) {
      Service.call(this, displayName, Service.SolarLocation.UUID, subtype);

      // Required Characteristics
      this.addCharacteristic(Characteristic.SolarLatitude);
      this.addCharacteristic(Characteristic.SolarLongitude);
    };
    inherits(Service.SolarLocation, Service);
    Service.SolarLocation.UUID = '0C982673-8293-4CE4-8AC3-9371980D81A7';
  }
};
