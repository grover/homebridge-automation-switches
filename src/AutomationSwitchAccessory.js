'use strict';

const clone = require('clone');

let Accessory, Characteristic, Service;

class SwitchAccessory {

  constructor(api, log, config, storage) {
    Accessory = api.hap.Accessory;
    Characteristic = api.hap.Characteristic;
    Service = api.hap.Service;

    this.log = log;
    this.name = config.name;
    this._config = config;

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
      .setCharacteristic(Characteristic.SerialNumber, this._config.serialNumber)
      .setCharacteristic(Characteristic.FirmwareRevision, this._config.version)
      .setCharacteristic(Characteristic.HardwareRevision, this._config.version);
  }

  getBridgingStateService() {
    return new Service.BridgingState()
      .setCharacteristic(Characteristic.Reachable, true)
      .setCharacteristic(Characteristic.LinkQuality, 4)
      .setCharacteristic(Characteristic.AccessoryIdentifier, this.name)
      .setCharacteristic(Characteristic.Category, Accessory.Categories.PROGRAMMABLE_SWITCH);
  }

  getSwitchService() {
    this._switchService = new Service.Switch(this.name);
    this._switchService.getCharacteristic(Characteristic.On)
      .on('set', this._setOn.bind(this))
      .updateValue(this._state.state);

    return this._switchService;
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
    this._motionSensor = new Service.MotionSensor(this.name);
    return this._motionSensor;
  }

  identify(callback) {
    this.log(`Identify requested on ${this.name}`);
    callback();
  }

  _setOn(on, callback) {
    this.log(`Setting switch state to ${on}`);

    this._resetTimer();

    const data = clone(this._state);
    data.state = on;

    this._persist(data, (error) => {
      if (error) {
        this.log('Storing the state change has failed.');
        callback(error);
        return;
      }

      if (on) {
        this._startTimer();
      }
    });

    callback();
  }

  _setPeriod(value, callback) {
    this.log(`Setting period value: d=${value}s`);

    const data = clone(this._state);
    data.period = value;

    this._persist(data, callback);
  }

  _setAutoOff(value, callback) {
    this.log(`Setting auto off value ${value}`);

    const data = clone(this._state);
    data.autoOff = value;

    this._persist(data, callback);
  }

  _startTimer() {
    const delay = this._state.period * 1000;

    this.log(`Starting timer for ${delay}ms`);
    this._timer = setTimeout(this._onTimeout.bind(this), delay);
  }

  _resetTimer() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = undefined;
    }
  }

  _onTimeout() {
    this._timer = undefined;
    this.onTimerExpired();
  }

  onTimerExpired() {
    if (this._state.autoOff) {
      this.log('Reseting switch');

      const data = clone(this._state);
      data.state = false;

      this._persist(data, (error) => {
        if (error) {
          this.log('Storing the state change has failed.');
          return;
        }

        this._switchService
          .getCharacteristic(Characteristic.On)
          .updateValue(false, undefined, undefined);
      });
    }

    this.signalMotion(true);
    setTimeout(this.nextPeriod.bind(this), 1000);
  }

  signalMotion(motion) {
    this._motionSensor
      .getCharacteristic(Characteristic.MotionDetected)
      .updateValue(motion, undefined, undefined);
  }

  nextPeriod() {
    this.signalMotion(false);
    if (!this._state.autoOff && this._state.state === false) {
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
