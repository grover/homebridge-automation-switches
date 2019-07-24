
# Automation Switches Platform

A platform that provides configurable switches for automation purposes. This platform can be created to provide time delayed responses in HomeKit rules or to simulate security systems.

## Status

[![HitCount](http://hits.dwyl.io/grover/homebridge-automation-switches.svg)](https://github.com/grover/homebridge-automation-switches)
[![Build Status](https://travis-ci.org/grover/homebridge-automation-switches.png?branch=master)](https://travis-ci.org/grover/homebridge-automation-switches)
[![Node version](https://img.shields.io/node/v/homebridge-automation-switches.svg?style=flat)](http://nodejs.org/download/)
[![NPM Version](https://badge.fury.io/js/homebridge-automation-switches.svg?style=flat)](https://npmjs.org/package/homebridge-automation-switches)

## Why do we need this plugin?

This platform provides software based, optionally persistent, switches to create DIY HomeKit solutions.
Each switch has specific purposes that are illustrated in their respective documents linked below.

The plugin provides four different types of switches: A basic on/off switch, a lock mechanism, an automation switch with advanced properties and a security system. All of them are configured ahead
of their use through the configuration file and each one of them potentially saves their state to storage
to keep their state even across crashes, reboots and such.

## Installation instructions

After [Homebridge](https://github.com/nfarina/homebridge) has been installed:

 ```sudo npm install -g homebridge-automation-switches```

## Example config.json:

```json
{
  "bridge": {
      ...
  },
  "platforms": [
    {
      "platform": "AutomationSwitches",
      "switches": [
        {
          "type": "automation",
          "name": "Automation Switch #1",
          "period": 1800,
          "autoOff": false
        },
        {
          "type": "security",
          "name": "Home alarm"
        }
      ]
    }
  ]
}
```

The platform can provide any number of switches that have to be predefined in the homebridge config.json.

### Switch types

Please see the documentation for each type of switch this plugin is able to create:

- [Automation switch](docs/AutomationSwitch.md)
- [Lock mechanism](docs/LockMechanism.md)
- [Security system](docs/SecuritySystem.md)
- [Switch](docs/Switch.md)
- [Slider](docs/Slider.md)
- [Alarm Clock](docs/AlarmClock.md)
- [Random value](docs/Random.md)
- [Solar Clock](docs/SolarClock.md)

An advanced configuration example containing all four switch types can be found [here](docs/Configuration.md).

### Storage

Every type of switch is able to store every state change to disk. This is useful if homebridge is restarted for whatever reason: The switches created by this plugin will retain the state they had before the restart.

For that the switches create individual files in the persist subfolder of your homebridge configuration folder.

## Developer Information

There's [documentation](docs/CustomCharacteristics.md) of the custom services and characteristics exposed by the switches.

## Supported clients

This platform and the switches it creates have been verified to work with the following apps on iOS 11:

* Home
* Elgato Eve

## Credits

See [CONTRIBUTORS](CONTRIBUTORS.md) for acknowledgements to the individuals that contributed to this plugin.

## Some asks for friendly gestures

If you use this and like it - please leave a note by staring this package here or on GitHub.

If you use it and have a problem, file an issue at [GitHub](https://github.com/grover/homebridge-automation-switches/issues) - I'll try to help.

If you tried this, but don't like it: tell me about it in an issue too. I'll try my best
to address these in my spare time.

If you fork this, go ahead - I'll accept pull requests for enhancements.

## License

MIT License

Copyright (c) 2017 Michael Fröhlich

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
