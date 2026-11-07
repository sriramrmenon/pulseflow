
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
