"use strict";

const version = require('../package.json').version;

var inherits = require('util').inherits;
var Accessory, Characteristic, Service;

class SwitchAccessory {

  constructor(api, log, config) {
    Accessory = api.hap.Accessory;
    Characteristic = api.hap.Characteristic;
    Service = api.hap.Service;

    this.log = log;
    this.name = config.name;
    this.version = config.version;
    this.category = Accessory.Categories.SWITCH;

    this._periodInSeconds = config.period;
    this._autoOff = config.autoOff;

    this._services = this.createServices();
    this._timer = undefined;
  }

  getServices() {
    return this._services;
  }

  createServices() {
    return [
      this.getAccessoryInformationService(),
      this.getBridgingStateService(),
      this.getSwitchService(),
      this.getSwitchProgramService(),
      this.getMotionSensorService()
    ];
  }

  getAccessoryInformationService() {
    return new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, 'Michael Froehlich')
      .setCharacteristic(Characteristic.Model, 'Automation Switch')
      .setCharacteristic(Characteristic.SerialNumber, '42')
      .setCharacteristic(Characteristic.FirmwareRevision, this.version)
      .setCharacteristic(Characteristic.HardwareRevision, this.version);
  }

  getBridgingStateService() {
    return new Service.BridgingState()
      .setCharacteristic(Characteristic.Reachable, true)
      .setCharacteristic(Characteristic.LinkQuality, 4)
      .setCharacteristic(Characteristic.AccessoryIdentifier, this.name)
      .setCharacteristic(Characteristic.Category, Accessory.Categories.PROGRAMMABLE_SWITCH);
  }

  getSwitchService() {
    const switchSvc = new Service.Switch(this.name);
    switchSvc.getCharacteristic(Characteristic.On)
      .on('set', this._setOn.bind(this))
      .on('get', this._getOn.bind(this));
    return switchSvc;
  }

  getSwitchProgramService() {
    const program = new Service.SwitchProgram(this.name);
    program.getCharacteristic(Characteristic.PeriodInSeconds)
      .on('set', this._setPeriod.bind(this))
      .on('get', this._getPeriod.bind(this));
    program.getCharacteristic(Characteristic.AutomaticOff)
      .on('set', this._setAutoOff.bind(this))
      .on('get', this._getAutoOff.bind(this));
    return program;
  }

  getMotionSensorService() {
    return new Service.MotionSensor(this.name);
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

  _getOn(callback) {
    this.log("Returning current power status value: s=" + (this._timer !== undefined));
    callback(undefined, this._timer !== undefined);
  }

  _setPeriod(value, callback) {
    this.log("Setting period value: d=" + value + "s");
    this._periodInSeconds = value;
    callback();
  }

  _getPeriod(callback) {
    this.log("Returning current period value: d=" + this._periodInSeconds + "s");
    callback(undefined, this._periodInSeconds);
  }

  _setAutoOff(value, callback) {
    this.log("Setting auto off value " + value);
    this._autoOff = value;
    callback();
  }

  _getAutoOff(callback) {
    this.log("Returning current auto off value " + this._autoOff);
    callback(undefined, this._autoOff);
  }

  _startTimer() {
    const delay = this._periodInSeconds * 1000;

    this.log("Starting timer for " + delay + "ms");
    this._timer = setTimeout(this._onTimeout.bind(this), delay);
  }

  _resetTimer() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = undefined;
    }
  }

  _onTimeout() {
    this.log("Reseting switch");
    this._timer = undefined;

    this.onTimerExpired();
  }

  onTimerExpired() {
    if (this._autoOff) {
      this.log("Reseting switch");

      this._services[1].getCharacteristic(Characteristic.On)
        .updateValue(false, undefined, undefined);
    }

    this.signalMotion(true);
    setTimeout(this.nextPeriod.bind(this), 1000);
  }

  signalMotion(motion) {
    this._services[3].getCharacteristic(Characteristic.MotionDetected).updateValue(motion, undefined, undefined);
  }

  nextPeriod() {
    this.signalMotion(false);
    if (!this._autoOff) {
      this._startTimer();
    }
  }
}

module.exports = SwitchAccessory;