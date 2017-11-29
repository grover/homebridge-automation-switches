"use strict";

const version = require('../package.json').version;

var inherits = require('util').inherits;
var Accessory, Characteristic, Service;

class DelayedSwitchAccessory {

  constructor(homebridge, log, config) {
    Accessory = homebridge.Accessory;
    Characteristic = homebridge.Characteristic;
    Service = homebridge.Service;

    this.log = log;
    this.name = config.name;
    this._delayInSeconds = config.defaultDelay;
    this._service = null;
    this._timer = 0;
  }

  getServices() {
    const services = [];

    this.log(`Adding ${this.name}`);

    services.push(this.getAccessoryInformationService());
    services.push(this._service = this.getDelayedSwitchService());

    return services;
  }

  getAccessoryInformationService() {
    return new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, 'Michael Froehlich')
      .setCharacteristic(Characteristic.Model, 'Delayed Switch')
      .setCharacteristic(Characteristic.SerialNumber, '42')
      .setCharacteristic(Characteristic.FirmwareRevision, version)
      .setCharacteristic(Characteristic.HardwareRevision, version);
  }

  getDelayedSwitchService() {
    const switchSvc = new Service.Switch(this.name);
    switchSvc.getCharacteristic(Characteristic.On).on('set', this._setOn.bind(this));

    /**
     * DelayedSwitchTimeout Characteristic
     */
    Characteristic.DelayedSwitchTimeout = function () {
      Characteristic.call(this, 'Delay', 'B469181F-D796-46B4-8D99-5FBE4BA9DC9C');

      this.setProps({
        format: Characteristic.Formats.INT,
        unit: Characteristic.Units.SECONDS,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE],
        minValue: 1,
        maxValue: 3600,
      });

      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.DelayedSwitchTimeout, Characteristic);
    Characteristic.DelayedSwitchTimeout.UUID = 'B469181F-D796-46B4-8D99-5FBE4BA9DC9C';

    switchSvc.addCharacteristic(Characteristic.DelayedSwitchTimeout);
    switchSvc.updateCharacteristic(Characteristic.DelayedSwitchTimeout, this._delayInSeconds);
    switchSvc.getCharacteristic(Characteristic.DelayedSwitchTimeout)
      .on('get', this._getDelay.bind(this))
      .on('set', this._setDelay.bind(this));

    return switchSvc;
  }

  identify(callback) {
    this.log(`Identify requested on ${this.name}`);
    callback();
  }

  _setOn(on, callback) {
    this.log("Setting switch state to " + on);

    this._resetTimer();
    if (on) {
      this._startTimer();
    }

    callback();
  }

  _startTimer() {
    const delay = this._delayInSeconds * 1000;

    this.log("Starting timer for " + delay + "ms");
    this._timer = setTimeout(this._onTimeout.bind(this), delay);
  }

  _resetTimer() {
    clearTimeout(this._timer);
    this._timer = 0;
  }

  _onTimeout() {
    this.log("Reseting switch");
    this._service.getCharacteristic(Characteristic.On).updateValue(false, undefined, undefined);
    this._timer = 0;
  }

  _getDelay(callback) {
    this.log("Returning current delay value: d=" + this._delayInSeconds + "s");
    callback(this._delayInSeconds);
  }

  _setDelay(value, callback) {
    this.log("Setting delay value: d=" + value + "s");
    this._delayInSeconds = value;
    callback();
  }
}

module.exports = DelayedSwitchAccessory;