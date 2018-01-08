
# Automation Switches Platform

A platform that provides configurable switches for automation purposes. This platform can be created to provide time delayed responses in HomeKit rules or to simulate security systems. 

## Why do we need this plugin?

HomeKit (as of iOS 11.1) does not provide a capability to delay the execution of rules. This platform provides switches that can be used to build a set of rules that are delayed in execution by a configurable period of time on each switch. The period as well as the repetetiveness and the response can be configured via HomeKit (while the configuration provides sane defaults) and can also be changed in response to rules.

The security system switches enable an easier creation of home alarm systems using already available
accessories.

## Installation instructions

After [Homebridge](https://github.com/nfarina/homebridge) has been installed:

 ```sudo npm install -g homebridge-automation-switches```

## Example config.json:

 ```
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

### Automation Switch Type

Each automation switch provides a regular switch, a motion sensor and a configuration service. Activating the switch starts a timer, which will trigger the motion sensor for 1s when the timer elapses. This can be used as a trigger for HomeKit rules.

The switch support two modes: An automatic shut off mode, where the motion sensor will only be tripped once and the switch is automatically shut off. The other mode is a repeating mode, where the motion sensor will be tripped repeatedly until the switch is shut off again.

| Attributes | Required | Usage |
|------------|----------|-------|
| type | No | If not set, creates an "automation" switch. If specified, this must be "automation" for automation switches. |
| name | Yes | A unique name for the switch. Will be used as the accessory name. |
| period | Yes | The default delay of the switch in seconds. |
| autoOff | Yes | Determines if the switch automatically shuts off after the period has elapsed. |

### Security System Switch Type

The security system switch type enables the creation of security systems. The switch can be armed in night, away and stay modes. Additionally there's an option to trigger an alarm using an On/Off characteristic.

The value of the characteristics is persisted if homebridge is restarted.

| Attributes | Required | Usage |
|------------|----------|-------|
| type | Yes | Must be set to "security" for this type of switch. |
| name | Yes | A unique name for the switch. Will be used as the accessory name. |

The settings of this switch are persisted to files in the homebridge configuration folder in the persist subfolder.

## Accessory Services

Each automation switch will expose four services:

* Accessory Information Service
* Switch Service
* Motion Sensor Service
* Switch Program Service

Each security switch will expose the following service:

* Accessory Information Service
* Security System Service

## Switch Program Service Characteristics

The exposed switch service supports the following characteristics:

| Characteristic | UUID | Permissions | Usage |
|---|---|---|---|
| Period | `B469181F-D796-46B4-8D99-5FBE4BA9DC9C` | READ, WRITE | The period of the switch in seconds. This value can be changed between 1s and 3600s. A change will only take effect the next time the switch is turned on. |
| AutomaticOff | `72227266-CA42-4442-AB84-0A7D55A0F08D` | READ, WRITE | Determines if the switch is shut off after the period has elapsed. If the switch is not automatically shut off, the timer will be restarted and the motion sensor will be triggered again until the switch is shut off externally. |
| Alarm | `72227266-CA42-4442-AB84-0A7D55A0F08D` | READ, WRITE, EVENTS | For security switches this characteristic enables the triggering of an alarm. Can also be used for additional rules. |

See [HomeKitTypes.js](src/HomeKitTypes.js) for details.

## Supported clients

This platform and the delayed switches it creates have been verified to work with the following apps on iOS 11

* Home
* Elgato Eve

## Credits

This plugin was initially forked from and inspired by [homebridge-delay-switch](https://github.com/nitaybz/homebridge-delay-switch) by @nitaybz

## Some asks for friendly gestures

If you use this and like it - please leave a note by staring this package here or on GitHub.

If you use it and have a
problem, file an issue at [GitHub](https://github.com/grover/homebridge-telegram/issues) - I'll try
to help. 

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