# Custom services and characteristics

Most of the switch types provided by this plugin use standard HomeKit characteristics. In some cases there was no way (or it made no sense) to bend the standard services/characteristics to enable the use cases supported by this plugin.

All custom services and characteristics used are listed below.

## Custom characteristics

All custom characteristics are defined in [HomeKitTypes.js](../src/HomeKitTypes.js).

### Custom automation switch characteristics

The automation switch provides a programming service, which allows dynamic changes to the time period between triggers and also control of the automatic shut off. These characteristics can be used in scenes to change the default behavior of the switch.

| Characteristic | UUID | Service | Permissions | Usage |
|---|---|---|---|
| Period | `B469181F-D796-46B4-8D99-5FBE4BA9DC9C` | READ, WRITE | `FD92B7CF-A343-4D7E-9467-FD251E22C374` | The period of the switch in seconds. This value can be changed between 1s and 3600s. A change will only take effect the next time the switch is turned on. |
| AutomaticOff | `72227266-CA42-4442-AB84-0A7D55A0F08D` | `FD92B7CF-A343-4D7E-9467-FD251E22C374` | READ, WRITE | Determines if the switch is shut off after the period has elapsed. If the switch is not automatically shut off, the timer will be restarted and the motion sensor will be triggered again until the switch is shut off externally. |

Both of these characteristics are provided on the custom SwitchProgramService.

### Custom security system characteristics

The security system provides an additional characteristic to trigger the Alarm state:

| Characteristic | UUID | Service | Properties | Description |
| Alarm | `72227266-CA42-4442-AB84-0A7D55A0F08D` | `0000008E-0000-1000-8000-0026BB765291` | READ, WRITE, EVENTS | This characteristic enables the triggering of an alarm. Can also be used for additional rules. |

This characteristic is provided as an extension on the standard security system service.

## Services

Each switch created by this accessory will provide the standard HomeKit services:

- AccessoryInformation service
- BridgingState service

### Automation switch

The automation switch additionally provides:

- Switch service
- MotionSensor service
- SwitchProgram service (see above)

### Lock mechanism

The lock mechanism service provides:

- LockMechanism service

### Security system

The security system switch provides:

- SecuritySystem service

### Switch

- Switch Service
