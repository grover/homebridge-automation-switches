"use strict";

const version = require('../package.json').version;
const clone = require('clone');
const inherits = require('util').inherits;

let Accessory, Characteristic, Service;

class SwitchAccessory {

  constructor(api, log, config, storage) {
    Accessory = api.hap.Accessory;
    Characteristic = api.hap.Characteristic;
    Service = api.hap.Service;

    this.log = log;
    this.name = config.name;
    this.version = config.version;
    this.category = Accessory.Categories.SWITCH;

    this._periodInSeconds = config.period;
    this._autoOff = config.autoOff;

    this._storage = storage;

    const defaultValue = {
      autoOff: config.autoOff,
      period: config.period,
      state: config.default === undefined ? false : config.default
    };

    storage.retrieve(defaultValue, (error, value) => {
      this._state = value;
    });


    this._services = this.createServices();
    this._timer = undefined;

    if (this._state.state) {
      this._startTimer();
    }
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
      .updateValue(this._state.state);

    return switchSvc;
  }

  getSwitchProgramService() {
    const program = new Service.SwitchProgram(this.name);
    program.getCharacteristic(Characteristic.PeriodInSeconds)
      .on('set', this._setPeriod.bind(this))
      .updateValue(this._state.period);

    program.getCharacteristic(Characteristic.AutomaticOff)
      .on('set', this._setAutoOff.bind(this))
      .updateValue(this._state.autoOff);

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

    const data = clone(this._state);
    data.state = on;

    this._persist(data, (error) => {
      if (error) {
        this.log('Storing the state change has failed.');
        callback(error);
        return;
      }

      this._startTimer();
    });

    callback();
  }

  _setPeriod(value, callback) {
    this.log("Setting period value: d=" + value + "s");

    const data = clone(this._state);
    data.period = value;

    this._persist(data, callback);
  }

  _setAutoOff(value, callback) {
    this.log("Setting auto off value " + value);

    const data = clone(this._state);
    data.autoOff = value;

    this._persist(data, callback);
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

  _persist(data, callback) {
    this._storage.store(data, (error) => {
      if (error) {
        callback(error);
        return;
      }

      this._state = data;
      callback();
    });
  }
}

module.exports = SwitchAccessory;