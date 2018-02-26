'use strict';

const clone = require('clone');

let Accessory, Characteristic, Service;

class AlarmClockAccessory {

  constructor(api, log, config, storage) {
    Accessory = api.hap.Accessory;
    Characteristic = api.hap.Characteristic;
    Service = api.hap.Service;

    this.log = log;
    this.name = config.name;
    this._config = config;

    this._alarmValue = Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
    this._noAlarmValue = Characteristic.ContactSensorState.CONTACT_DETECTED;

    this.log(`Timezone is ${process.env.TZ}`);
    this.log(`Local time is ${new Date().toLocaleString()}`);
    this.log(`UTC time is ${new Date().toUTCString()}`);

    this._storage = storage;

    const defaultValue = {
      hour: config.hour || 12,
      minute: config.minute || 0,
      enabled: config.enabled === undefined ? false : config.enabled
    };

    storage.retrieve(defaultValue, (error, value) => {
      this._state = value;

      if (this._state.enabled) {
        this._scheduleAlarmClock();
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
      this.getClockService(),
      this.getEnabledSwitchService(),
      this.getContactSensorService()
    ];
  }

  getAccessoryInformationService() {
    return new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, 'Michael Froehlich')
      .setCharacteristic(Characteristic.Model, 'Switch')
      .setCharacteristic(Characteristic.SerialNumber, this._config.serialNumber)
      .setCharacteristic(Characteristic.FirmwareRevision, this._config.version)
      .setCharacteristic(Characteristic.HardwareRevision, this._config.version);
  }

  getBridgingStateService() {
    return new Service.BridgingState()
      .setCharacteristic(Characteristic.Reachable, true)
      .setCharacteristic(Characteristic.LinkQuality, 4)
      .setCharacteristic(Characteristic.AccessoryIdentifier, this.name)
      .setCharacteristic(Characteristic.Category, Accessory.Categories.SWITCH);
  }

  getClockService() {
    this._clockService = new Service.Clock(`${this.name} Time`);
    this._clockService.getCharacteristic(Characteristic.ClockHour)
      .on('set', this._setHour.bind(this))
      .updateValue(this._state.hour);
    this._clockService.getCharacteristic(Characteristic.ClockMinute)
      .on('set', this._setMinute.bind(this))
      .updateValue(this._state.minute);

    return this._clockService;
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
    this._contactSensor = new Service.ContactSensor(`${this.name} Alarm`);
    this._contactSensor.getCharacteristic(Characteristic.ContactSensorState)
      .updateValue(this._noAlarmValue);

    return this._contactSensor;
  }

  identify(callback) {
    this.log(`Identify requested on ${this.name}`);
    callback();
  }

  _setHour(value, callback) {
    this.log(`Change target hour of ${this.name} to ${value}`);

    const data = clone(this._state);
    data.hour = value;

    this._persist(data, callback);
  }

  _setMinute(value, callback) {
    this.log(`Change target minute of ${this.name} to ${value}`);

    const data = clone(this._state);
    data.minute = value;

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

      this._restartAlarmTimer();
    });
  }

  _restartAlarmTimer() {
    if (this._timer) {
      clearTimeout(this._timer);
    }

    if (this._state.enabled) {
      this._scheduleAlarmClock();
    }
  }

  _scheduleAlarmClock() {
    // Figure out if the time is still today or the next day and set a timer
    const now = new Date();
    const alarm = new Date();

    alarm.setHours(this._state.hour, this._state.minute, 0);
    if (now > alarm) {
      // Alarm is tomorrow - add a day
      alarm.setDate(alarm.getDate() + 1);
    }

    this.log(`Raising next alarm at ${alarm.toLocaleString()}`);

    const diff = alarm.valueOf() - now.valueOf();
    // this.log(`Diff=${diff}, now=${now.valueOf()} (${now.toLocaleString()}), alarm=${alarm.valueOf()}`);
    this._timer = setTimeout(this._alarm.bind(this), diff);
  }

  _alarm() {
    this.log('Alarm!');
    this._contactSensor.getCharacteristic(Characteristic.ContactSensorState)
      .updateValue(this._alarmValue);

    setTimeout(this._silenceAlarm.bind(this), 1000);
  }

  _silenceAlarm() {
    this.log('Alarm silenced!');
    this._contactSensor.getCharacteristic(Characteristic.ContactSensorState)
      .updateValue(this._noAlarmValue);
    this._scheduleAlarmClock();
  }
}

module.exports = AlarmClockAccessory;
