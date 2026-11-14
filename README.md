
# PulseFlow

PulseFlow is a camera-based breathing visualisation application built using the Presage SmartSpectra SDK.

The application aims to display real-time breathing measurements captured through a webcam and provide an interactive breathing animation.

This project is being developed as part of the **Presage SmartSpectra SDK Challenge 2026** on DEV Community.

## Project Overview

The goal of PulseFlow is to explore how camera-based physiological measurements can be integrated into an interactive desktop application.

Using the Presage SmartSpectra SDK, the application will process camera input to obtain breathing measurements and present them through a simple, user-friendly interface.

PulseFlow is intended as an experimental wellness and educational application, not a medical device.

## Objectives

The main objectives of this project are:

- Learn how to integrate a third-party SDK into a Node.js application.
- Understand how to capture and process real-time measurements.
- Develop practical JavaScript and application development skills.
- Create an interactive breathing visualisation.
- Implement appropriate camera permissions and responsible data handling.
- Build and document a functional application for the DEV Community challenge.

## Planned Features

The following features are planned for the initial version:

- **Camera Access:** Allow users to enable their webcam with explicit consent.
- **Live Breathing Rate:** Display breathing measurements provided by the SmartSpectra SDK.
- **Breathing Visualisation:** Create an animated circle that responds to the breathing signal.
- **Guided Breathing:** Provide an optional guided breathing exercise.
- **Measurement Status:** Display SDK feedback when lighting, movement or camera conditions affect measurement quality.
- **Start/Stop Controls:** Allow users to start and stop a measurement session.
- **Privacy:** Clearly explain camera access, processing and any data storage or transmission.

Features will be implemented incrementally and may change as the project develops.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| JavaScript | Application programming language |
| Node.js 24 | JavaScript runtime environment |
| npm | Package and dependency management |
| Presage SmartSpectra SDK | Camera-based physiological signal measurements |
| Electron (planned) | Desktop application framework |
| HTML/CSS (planned) | User interface and visualisation |
| Git | Version control |
| Bitbucket | Private development repository |
| GitHub (planned) | Public repository for challenge submission |

## Development Environment

The project is currently being developed on:

- Operating System: Lubuntu Linux
- Architecture: x86_64
- Node.js: v24.22.2
- npm: 11.x
- Node Version Manager (NVM)

The required Node.js version is specified in `.nvmrc`.

## Project Setup

The following steps initialise the Node.js project.

### Prerequisites

- Git
- Node.js 24
- npm
- NVM (recommended)

### Clone the Repository

Clone the repository using your authorised repository URL:

```bash
git clone <repository-url>
cd pulseflow
```

### Select the Node.js Version

```bash
nvm use
```

### Install Dependencies

Once dependencies have been added to the project, install them using:

```bash
npm install
```

**Note:** The SmartSpectra SDK and Electron have not yet been integrated. Application execution instructions will be added as development progresses.

## Development Status

**Current stage: Initial Project Setup**

Completed:

- [x] Created the private Bitbucket repository.
- [x] Installed Node.js 24 using NVM.
- [x] Initialised the Node.js project.
- [x] Created the initial `package.json`.
- [x] Added `.nvmrc`.
- [x] Added `.gitignore`.
- [x] Created the initial project documentation.

Planned:

- [ ] Review the SmartSpectra SDK integration requirements.
- [ ] Install and configure the SmartSpectra SDK.
- [ ] Verify webcam access and SDK measurements.
- [ ] Implement live breathing measurement handling.
- [ ] Create the Electron application interface.
- [ ] Implement breathing visualisation and controls.
- [ ] Test application functionality and privacy behaviour.
- [ ] Record a demonstration video.
- [ ] Publish the project repository on GitHub.
- [ ] Submit the project to the DEV Community challenge.

## Privacy and Responsible Use

PulseFlow is intended for educational and general wellness purposes only.

It is not intended for medical diagnosis, treatment or clinical decision-making.

Camera access will require user consent.

The application's handling of camera frames, physiological measurements, SDK telemetry, storage and data retention will be documented once the SDK integration has been implemented and verified.

API keys and other credentials must not be committed to the repository.

## Challenge Information

**Challenge:** Presage SmartSpectra SDK Challenge 2026

**Platform:** DEV Community

**Submission Deadline:** 22 November 2026

**Challenge:** https://dev.to/challenges/presage-2026-11-04

The final submission is expected to include:

- A functional application using at least one live SmartSpectra signal.
- A public source-code repository.
- Application setup instructions.
- A demonstration video.
- A DEV Community submission article.
- An explanation of camera consent and data handling.

## Licence

The project licence has not yet been finalised. The application licence and the SmartSpectra SDK's licensing requirements will be reviewed before public release.

# Camera Integration and Testing (macOS)

## Overview

PulseFlow uses the Presage SmartSpectra Node.js SDK to measure breathing rate through a webcam without requiring physical sensors.

Camera integration has been tested on macOS using the built-in FaceTime HD Camera.

## 1. System Requirements

- macOS with a supported webcam
- Node.js v24.22.2 (tested version)
- npm
- SmartSpectra Node.js SDK (`@smartspectra/node-sdk`)
- Valid Presage Physiology API key
- Camera permissions enabled for the terminal application

## 2. Installation and Setup

Clone the PulseFlow repository and navigate to the project directory.

Install the dependencies:

```bash
npm install
```

Configure the SmartSpectra API key as an environment variable:

```bash
export SMARTSPECTRA_API_KEY="YOUR_API_KEY"
```

Never commit API keys or credentials to the repository.

Verify that the environment variable is configured:

```bash
node -e "console.log(Boolean(process.env.SMARTSPECTRA_API_KEY))"
```

Expected output:

```text
true
```

This confirms that the variable contains a value, but does not validate the key with Presage.

## 3. Running PulseFlow

Start the application:

```bash
node cameratest.js
```

The application discovers available cameras and displays a numbered list.

Example output from testing:

```text
Available cameras:
1. FaceTime HD Camera

Enter camera number: 1
Selected camera: FaceTime HD Camera

Allow PulseFlow to use "FaceTime HD Camera" for breathing measurement? (yes/no): yes
```

Camera access is requested explicitly before a measurement session begins.

After consent, the application displays:

```text
PulseFlow Measurement Menu
1. Start measurement
2. Stop measurement
3. Exit
```

Selecting option 1 starts SmartSpectra measurement. Option 2 stops the session and attempts SDK cleanup. Option 3 exits the application.

Ctrl+C also initiates the shutdown procedure.

## 4. Camera Positioning and Measurement Quality

SmartSpectra uses camera images to estimate physiological signals. Suitable framing, positioning and lighting are important for obtaining stable measurements.

Recommended conditions:

- Face the camera directly.
- Keep your face clearly visible.
- Position the camera so that sufficient upper chest area is visible.
- Use consistent, adequate lighting.
- Avoid excessive movement during measurement.
- Allow time for the breathing signal to stabilise.

During testing, the SDK returned the following validation messages:

| Validation code | Message |
|---|---|
| 0 | Hold still and record |
| 1 | No face found |
| 7 | Place more of the chest in view |

PulseFlow displays validation messages so users can adjust their positioning when necessary.

## 5. Breathing Measurements

The application retrieves breathing measurements through the SmartSpectra metrics event.

Each breathing measurement includes:

- **value:** Breathing rate in breaths per minute.
- **stable:** Whether the SDK marks the measurement as stable.
- **confidence:** SDK-provided confidence value.

Example output from live testing:

```text
Breathing measurement: 14.41 breaths/min | Stable: true | Confidence: 51.42
Breathing measurement: 17.03 breaths/min | Stable: true | Confidence: 56.58
Breathing measurement: 23.80 breaths/min | Stable: true | Confidence: 60.27
```

PulseFlow displays breathing measurements only when the value is finite, the current validation status is `kOk`, and the SDK reports `stable: true`.

When the measurement is unavailable or unstable, the application displays messages such as:

```text
Waiting for a valid breathing signal...
No breathing signal available. Waiting...
Breathing signal is not stable yet.
```

Quality messages are limited to approximately one every five seconds to reduce repetitive console output.

A stable signal is an SDK quality indication, not a guarantee of clinical accuracy.

## 6. Observed SDK Warnings and Errors

The following warnings were observed during testing on macOS.

### AVFoundation Camera Warnings

```text
AVFoundation: device does not support continuous auto-exposure
AVFoundation: device does not support continuous auto white balance
AVFoundation: device does not support continuous auto-focus
```

Additional warnings indicated that the camera did not support locking exposure, white balance or focus.

These warnings describe unsupported camera capabilities.

They did not prevent the application from receiving breathing measurements during the successful tests.

### Inference Feedback Warning

```text
Feedback manager requires a model with a single signature inference.
Disabling support for feedback tensors.
```

This warning originated from the underlying inference components. Measurements were still produced during testing.

### Landmark Projection Warning

```text
Using NORM_RECT without IMAGE_DIMENSIONS is only supported for the square ROI.
```

This warning was observed during processing. Its effect was not independently investigated, but it did not prevent successful breathing measurements in the recorded tests.

### SDK State Error

```text
SmartSpectra is not in a valid state for this operation.
```

This error was occasionally observed during measurement shutdown.

In the affected tests, the Stop operation subsequently completed. Later Stop tests completed without this error.

### API Authentication Error

An HTTP 401 authentication error was initially encountered:

```text
Metrics authorization failed.
Status: 401
Invalid or missing API key
```

The SDK rejected the supplied credentials.

Subsequent tests completed successfully and produced live breathing measurements without the authentication error recurring.

## 7. Functional Testing Results

Testing was performed on macOS using the built-in FaceTime HD Camera.

| Test case | Result |
|---|---|
| Detect available camera | Passed |
| Select camera | Passed |
| Request explicit camera consent | Passed |
| Start measurement | Passed |
| Receive live breathing readings | Passed |
| Receive validation status and hints | Passed |
| Identify stable measurements | Passed |
| Display confidence values | Passed |
| Handle missing and unstable readings | Passed |
| Stop measurement | Passed |
| Restart measurement after Stop | Passed |
| Start → Stop → Start → Stop → Exit | Passed |
| Ctrl+C graceful shutdown | Passed |

## 8. Known Limitations

- Camera capability warnings may appear depending on the hardware.
- Measurement quality depends on lighting, positioning and movement.
- Unstable or missing measurements are not displayed as valid breathing readings.
- A prolonged absence of metrics events is not currently detected using a dedicated timeout.
- Native SDK resource release was assessed through successful Stop, restart and process exit behaviour, rather than independent resource inspection.
- PulseFlow is a prototype and its breathing measurements should not be treated as medical diagnoses.

## 9. Conclusion

SmartSpectra camera integration has been successfully verified on macOS.

PulseFlow can detect and select a camera, obtain user consent, start breathing measurements, display validation guidance, report stable breathing values and stop or restart measurement sessions.

The application also supports shutdown through the menu and Ctrl+C.

The macOS camera integration requirements for PUL-20 have been functionally verified.