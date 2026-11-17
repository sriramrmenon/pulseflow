# PulseFlow

**Real-time, camera-based breathing visualisation using the Presage SmartSpectra SDK.**

PulseFlow is a desktop application built with Node.js, Electron and the Presage SmartSpectra SDK. It uses a standard camera to estimate a person's breathing rate and displays the result through an interactive breathing visualisation.

The application provides live breathing-rate measurements, signal-quality feedback, camera-positioning guidance and breathing-inspired animations.

PulseFlow was developed for the **Presage SmartSpectra SDK Challenge 2026**.

## Features

- **Contactless breathing measurement:** Uses the SmartSpectra SDK to estimate breathing rate from a camera.
- **Live breathing-rate display:** Shows measurements in breaths per minute.
- **Signal validation:** Displays measurement quality and distinguishes stable, unstable and unavailable signals.
- **Breathing waveform:** Displays a breathing-inspired animated trace whose cycle duration follows the measured breathing rate.
- **Breathing ripples:** Generates expanding visual ripples that respond to the measured breathing rate.
- **Camera-positioning guidance:** Displays SDK feedback to help users improve measurement conditions.
- **Measurement acquisition indicator:** Shows when the application is waiting for a valid breathing signal.
- **Camera selection:** Allows users to select an available camera.
- **Camera consent:** Requests confirmation before starting a measurement.
- **Start and Stop controls:** Allows users to manage measurement sessions.
- **Responsive interface:** Adjusts the layout when the Electron window is resized.

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Electron | Desktop application framework |
| SmartSpectra Node.js SDK | Camera-based breathing measurements |
| JavaScript | Application logic and event handling |
| HTML and CSS | Application interface and animations |
| Playwright | Automated Electron UI and regression testing |

## Prerequisites

Before running PulseFlow, ensure you have:

- Node.js 24 (the version used during development).
- npm.
- A supported desktop operating system.
- A working camera.
- A valid Presage SmartSpectra API key.
- Permission to access the camera.

Refer to the [SmartSpectra Node.js documentation](https://smartspectra.presagetech.com/docs/nodejs/) for current operating-system and hardware requirements.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/sriramrmenon/pulseflow.git
cd pulseflow
```

### 2. Install dependencies

```bash
npm ci
```

This installs the dependencies specified in the project's lockfile.

### 3. Configure the API key

Create a developer account and obtain an API key from the [Presage Developer Portal](https://physiology.presagetech.com/).

On macOS or Linux, set the environment variable:

```bash
export SMARTSPECTRA_API_KEY="your_api_key_here"
```

The API key must be configured in the terminal session used to launch the application.

Do not commit API keys, credentials or environment files containing secrets to Git.

### 4. Start PulseFlow

```bash
npm start
```

The Electron application should open and attempt to discover available cameras.

## How to Use

1. Launch PulseFlow.
2. Select a camera from the list of available devices.
3. Click **Start**.
4. Confirm camera access when prompted.
5. Position yourself in front of the camera with your face and upper chest visible.
6. Remain relatively still while the application attempts to obtain a stable breathing signal.
7. Follow the positioning guidance displayed by PulseFlow.
8. Once a stable measurement is available, the breathing rate and visualisations update.
9. Click **Stop** to end the measurement.

The application can retain the last available reading after stopping. Where a reading has not been verified as stable, it is labelled accordingly.

## Understanding the Display

### Breathing Rate

Displays the estimated breathing rate in breaths per minute.

### Signal Quality

Indicates whether a measurement is stable, unstable, unavailable or represents a previously valid reading.

### Breathing Visualisation

PulseFlow provides two animated visualisations:

**Breathing waveform**

A simulated, breathing-inspired trace whose cycle duration is calculated using the breathing-rate estimate.

**Breathing ripples**

Expanding ripples that respond to the estimated breathing frequency.

These visualisations are driven by the SmartSpectra breathing-rate metric. They do not represent directly measured inhalation or exhalation waveforms.

### Positioning Guidance

SmartSpectra validation messages are presented to help users improve measurement conditions.

The guidance remains visible while a stable measurement is unavailable and is hidden when a fresh stable reading is obtained or the session stops.

## SmartSpectra SDK Integration

PulseFlow integrates the `@smartspectra/node-sdk` package.

The application uses the SDK to:

- Discover available cameras.
- Select the camera for measurement.
- Initialise and start a measurement session.
- Receive breathing metrics.
- Decode the SDK metric payload.
- Process validation and measurement-quality information.
- Stop measurements and release SDK resources.

A breathing-rate value is treated as a valid live reading only when it is numerical, marked stable by the SDK and accompanied by a valid SDK validation state.

When a measurement becomes stale or unstable, PulseFlow stops the live animations rather than presenting an old reading as a current measurement.

The application also includes a modular command-line prototype for testing the SmartSpectra integration separately from the Electron interface.

## Testing

PulseFlow uses Playwright for automated Electron UI testing.

The test suite covers:

- Application startup and visibility of the main controls.
- Initial state without measurements.
- Flat waveform when no live measurement exists.
- Creation of breathing ripple elements.
- Measurement acquisition feedback.
- Activation of visualisations after a valid reading.
- Handling stale measurements.
- Persistent positioning guidance.
- Retention of the last valid reading after stopping.
- Prevention of live animations for unverified measurements.

Run the test suite using:

```bash
npm run test:smoke
```

During development, all 10 automated tests passed.

The automated tests use simulated SDK-facing events to verify Electron and renderer behaviour. They do not independently validate the accuracy of the SmartSpectra measurements or replace testing with a physical camera.

## Camera Consent and Data Handling

PulseFlow requires explicit user confirmation before starting a camera-based measurement.

### Camera access

- The user selects the camera before starting a session.
- The application requests confirmation before beginning measurement.
- Camera access is used for SmartSpectra breathing measurements.
- Stopping or closing the application initiates SDK and camera-resource cleanup.

### Measurement data

PulseFlow displays breathing-rate measurements, quality information and positioning guidance.

The current implementation does not include an application database, user accounts, cloud synchronisation or a feature for uploading measurement histories.

The most recent reading may remain visible in the interface after a session stops.

PulseFlow does not intentionally save camera recordings or snapshots as application files.

### SmartSpectra SDK telemetry

The SmartSpectra SDK has diagnostic session telemetry enabled by default unless it is explicitly disabled in SDK configuration.

According to Presage's documentation, this diagnostic telemetry can include aggregate session information such as SDK version, operating system, session outcome, performance statistics and counts of validation states.

Presage states that this telemetry does not contain raw camera frames, measured breathing-rate values or stable user identifiers.

The SDK may communicate with Presage services as part of its normal operation.

For details, see [SmartSpectra SDK Telemetry and Privacy](https://smartspectra.presagetech.com/docs/telemetry-and-privacy/).

### Third-party AI services

PulseFlow's current measurement and visualisation workflow does not integrate external generative AI services.

### Retention and deletion

PulseFlow does not currently provide persistent storage for breathing-measurement history.

Measurements held by the running application are not intended to persist as a history after the application closes.

SDK-side data handling and telemetry are governed by Presage's own documentation and policies.

## Limitations

- PulseFlow is a prototype intended for demonstration and general informational use.
- Breathing-rate estimates depend on camera positioning, lighting, motion and signal quality.
- Obtaining a stable measurement may take time.
- The visual waveform is simulated from the measured breathing rate rather than generated from a measured respiratory waveform.
- A stable breathing-rate estimate does not identify the exact timing of individual inhalations and exhalations.
- Automated UI tests use simulated events and cannot establish clinical or measurement accuracy.
- The application has not been packaged into platform-specific installers.

**PulseFlow is not a medical device and must not be used for diagnosis, treatment or medical decision-making.**

## Project Structure

```text
pulseflow/
├── main.js
├── preload.js
├── renderer.js
├── index.html
├── styles.css
├── cameratest.js
├── measurement.js
├── menu.js
├── tests/
│   └── pulseflow.spec.js
├── package.json
├── package-lock.json
└── README.md
```

Main components:

- `main.js` — Electron main process and SmartSpectra SDK integration.
- `preload.js` — Secure IPC bridge between the Electron main process and renderer.
- `renderer.js` — UI interaction, breathing visualisations and measurement feedback.
- `styles.css` — Responsive layout and visual styling.
- `index.html` — Application structure.
- `cameratest.js` — Command-line entry point for SDK testing.
- `menu.js` — Command-line measurement menu.
- `measurement.js` — SDK lifecycle and metrics processing for the terminal prototype.
- `tests/pulseflow.spec.js` — Automated Electron UI and regression tests.

## Future Improvements

Possible future enhancements include:

- Visualising additional SmartSpectra metrics.
- Session-based breathing artwork.
- Persistent measurement history with appropriate privacy controls.
- Additional automated integration tests.
- Application packaging for desktop distribution.
- CI/CD and observability integration.

These features are not part of the current challenge submission.

## Acknowledgements

- [Presage Technologies](https://presagetech.com/) — SmartSpectra SDK.
- [Electron](https://www.electronjs.org/) — Desktop application framework.
- [Playwright](https://playwright.dev/) — Automated testing framework.
- [DEV Community](https://dev.to/) — Presage SmartSpectra SDK Challenge 2026.

---

**PulseFlow — Camera-based breathing measurement, brought to life through interactive visualisation.**