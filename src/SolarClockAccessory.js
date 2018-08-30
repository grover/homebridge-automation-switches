'use strict';

const clone = require('clone');
const suncalc = require('suncalc');

let Accessory, Characteristic, Service;

class SolarClockAccessory {

  constructor(api, log, config, storage) {
    Accessory = api.hap.Accessory;
    Characteristic = api.hap.Characteristic;
    Service = api.hap.Service;

    this.log = log;
    this.name = config.name;
    this.version = config.version;
    this.location = config.location || [ 0, 0 ];
    if (Array.isArray(this.location)) this.location = { latitude: this.location[0], longitude: this.location[1] };

    const latitude = parseFloat(this.location.latitude);
    const longitude = parseFloat(this.location.longitude);
    if (isNaN(latitude) || (Math.abs(latitude) > 90) || isNaN(longitude)|| (Math.abs(longitude) > 180)) {
      throw new Error('invalid location: ' + config.location);
    }
    this.location = { latitude: latitude, longitude: longitude };

    this._solarValue = Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
    this._noSolarValue = Characteristic.ContactSensorState.CONTACT_DETECTED;

    this._storage = storage;

    const defaultValue = {
      period: 0,
      offset: config.offset || 0,
      enabled: config.enabled === undefined ? false : config.enabled
    };
    config.period = config.period.toLowerCase();
    for (let i = Characteristic.SolarPeriod._SolarPeriods.length - 1; i >= 0; i--) {
      if (Characteristic.SolarPeriod._SolarPeriods[i].toLowerCase() !== config.period) continue;

      defaultValue.period = i;
      break;
    }

    storage.retrieve(defaultValue, (error, value) => {
      this._state = value;

      if (this._state.enabled) {
        this._scheduleSolarClock();
      }
    });

    this._services = this.createServices();
  }

  getServices() {
    return this._services;
  }

  createServices() {
    return [
      this.getAccessoryInformationService(),
      this.getBridgingStateService(),
      this.getSolarService(),
      this.getEnabledSwitchService(),
      this.getContactSensorService()
    ];
  }

  getAccessoryInformationService() {
    return new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, 'The Homespun')
      .setCharacteristic(Characteristic.Model, 'Switch')
      .setCharacteristic(Characteristic.SerialNumber, '44')
      .setCharacteristic(Characteristic.FirmwareRevision, this.version)
      .setCharacteristic(Characteristic.HardwareRevision, this.version);
  }

  getBridgingStateService() {
    return new Service.BridgingState()
      .setCharacteristic(Characteristic.Reachable, true)
      .setCharacteristic(Characteristic.LinkQuality, 4)
      .setCharacteristic(Characteristic.AccessoryIdentifier, this.name)
      .setCharacteristic(Characteristic.Category, Accessory.Categories.SWITCH);
  }

  getSolarService() {
    this._solarService = new Service.Solar(`${this.name} Period`)
      .setCharacteristic(Characteristic.SolarLatitude, this.location.latitude)
      .setCharacteristic(Characteristic.SolarLongitude, this.location.longitude);
    this._solarService.getCharacteristic(Characteristic.SolarPeriod)
      .on('set', this._setPeriod.bind(this))
      .updateValue(this._state.period);
    this._solarService.getCharacteristic(Characteristic.SolarMinutesOffset)
      .on('set', this._setOffset.bind(this))
      .updateValue(this._state.offset);

    return this._solarService;
  }

  getEnabledSwitchService() {
    this._switchService = new Service.Switch(`${this.name} Enabled`);
    this._switchService.getCharacteristic(Characteristic.On)
      .on('set', this._setEnabledState.bind(this))
      .updateValue(this._state.enabled);

    this._switchService.isPrimaryService = true;

    return this._switchService;
  }

  getContactSensorService() {
    this._contactSensor = new Service.ContactSensor(`${this.name} Solar`);
    this._contactSensor.getCharacteristic(Characteristic.ContactSensorState)
      .updateValue(this._noSolarValue);

    return this._contactSensor;
  }

  identify(callback) {
    this.log(`Identify requested on ${this.name}`);
    callback();
  }

  _setPeriod(value, callback) {
    this.log(`Change target period of ${this.name} to ${value} ${Characteristic.SolarPeriod._SolarPeriods[value]}`);

    const data = clone(this._state);
    data.period = value;

    this._persist(data, callback);
  }

  _setOffset(value, callback) {
    this.log(`Change target offset of ${this.name} to ${value}`);

    const data = clone(this._state);
    data.offset = value;

    this._persist(data, callback);
  }

  _setEnabledState(value, callback) {
    this.log(`Change enabled state of ${this.name} to ${value}`);

    const data = clone(this._state);
    data.enabled = value;

    this._persist(data, callback);
  }

  _persist(data, callback) {
    this._storage.store(data, (error) => {
      if (error) {
        callback(error);
        return;
      }

      this._state = data;
      callback();

      this._restartSolarTimer();
    });
  }

  _restartSolarTimer() {
    if (this._timer) {
      clearTimeout(this._timer);
    }

    if (this._state.enabled) {
      this._scheduleSolarClock();
    }
  }

  _scheduleSolarClock() {
    ///////////////////////////////////////////////////////////////////////////////////////////
    // algorithm taken from https://github.com/kcharwood/homebridge-suncalc
    ///////////////////////////////////////////////////////////////////////////////////////////

    const nowDate = new Date();
    const now = nowDate.getTime();

    const sunDates = suncalc.getTimes(nowDate, this.location.latitude, this.location.longitude);
    const times = {
      nightEnd: sunDates.nightEnd.getTime(),
      nauticalDawn: sunDates.nauticalDawn.getTime(),
      dawn: sunDates.dawn.getTime(),
      sunrise: sunDates.sunrise.getTime(),
      sunriseEnd: sunDates.sunriseEnd.getTime(),
      sunsetStart: sunDates.sunsetStart.getTime(),
      sunset: sunDates.sunset.getTime(),
      dusk: sunDates.dusk.getTime(),
      nauticalDusk: sunDates.nauticalDusk.getTime(),
      night: sunDates.night.getTime()
    };

    let solarPeriod = 0;
    let nextUpdate;

    if (now < times.dawn) {
      nextUpdate = times.dawn;
    } else if (now >= times.dawn && now < times.sunrise) {
      nextUpdate = times.sunrise;
      solarPeriod = 1;
    } else if (now >= times.sunrise && now < times.sunriseEnd) {
      nextUpdate = times.sunriseEnd;
      solarPeriod = 2;
    } else if (now >= times.sunriseEnd && now < times.sunsetStart) {
      nextUpdate = times.sunsetStart;
      solarPeriod = 3;
    } else if (now >= times.sunsetStart && now < times.sunset) {
      nextUpdate = times.sunset;
      solarPeriod = 4;
    } else if (now >= times.sunset && now < times.dusk){
      nextUpdate = times.dusk;
      solarPeriod = 5;
    } else {
      const tomorrow = new Date();

      tomorrow.setDate(tomorrow.getDate() + 1);
      nextUpdate = suncalc.getTimes(tomorrow, this.location.latitude, this.location.longitude).dawn.getTime();
    }

    this.log(`Current Solar Period ${solarPeriod}`);
    if (this._state.period === solarPeriod) this._solar();

    this.log(`Time to next update ${nextUpdate - now}ms`);
    this._timer = setTimeout(this._scheduleSolarClock.bind(this), nextUpdate - now);
  }

  _solar() {
    this.log('Solar!');
    this._contactSensor.getCharacteristic(Characteristic.ContactSensorState)
      .updateValue(this._solarValue);

    setTimeout(this._silenceSolar.bind(this), 1000);
  }

  _silenceSolar() {
    this.log('Solar silenced!');
    this._contactSensor.getCharacteristic(Characteristic.ContactSensorState)
      .updateValue(this._noSolarValue);
  }
}

module.exports = SolarClockAccessory;
