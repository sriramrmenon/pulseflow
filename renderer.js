
// HTML elements
const element = document.getElementById('breathing-rate');
const cameraSelect = document.getElementById('camera-select');
const cameraStatus = document.getElementById('camera-status');

const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');

const sessionStatus = document.getElementById('session-status');
const signalQuality = document.getElementById('signal-quality');
const measurementMessage = document.getElementById('measurement-message');
const validationMessage = document.getElementById('validation-message');

let currentSessionStatus = 'idle';

// Floating positioning guidance popup
const guidancePopup = document.createElement('div');
guidancePopup.className = 'guidance-popup';
guidancePopup.setAttribute('role', 'status');
guidancePopup.setAttribute('aria-live', 'polite');

document.body.appendChild(guidancePopup);

let guidanceTimeout = null;
let previousGuidance = '';

function showGuidancePopup(message) {
    if (currentSessionStatus !== 'measuring') {
        return;
    }

    // Avoid repeatedly displaying the same instruction
    if (
        message === previousGuidance &&
        guidancePopup.classList.contains('visible')
    ) {
        return;
    }

    previousGuidance = message;
    guidancePopup.textContent = message;
    guidancePopup.classList.add('visible');

    clearTimeout(guidanceTimeout);

    guidanceTimeout = setTimeout(() => {
        guidancePopup.classList.remove('visible');
    }, 4000);
}

// Full-window breathing ripples
const rippleLayer = document.createElement('div');
rippleLayer.className = 'ripple-layer';

for (let i = 0; i < 3; i++) {
    const ripple = document.createElement('div');
    ripple.className = 'breathing-ripple';
    ripple.style.setProperty('--ripple-index', i);
    rippleLayer.appendChild(ripple);
}

document.body.appendChild(rippleLayer);

// Use the existing centre dot as the ripple origin
const breathingDot = document.querySelector('.circle-centre');

function updateRippleOrigin() {
    if (!breathingDot) {
        return;
    }

    const rect = breathingDot.getBoundingClientRect();

    rippleLayer.style.setProperty(
        '--ripple-x',
        `${rect.left + rect.width / 2}px`
    );

    rippleLayer.style.setProperty(
        '--ripple-y',
        `${rect.top + rect.height / 2}px`
    );
}

window.addEventListener('resize', updateRippleOrigin);
window.addEventListener('scroll', updateRippleOrigin, true);

// Small breathing waveform at the top right
const measurementPanel = document.querySelector('.measurement');

const waveformPanel = document.createElement('div');
waveformPanel.className = 'waveform-panel';

const waveformLabel = document.createElement('div');
waveformLabel.className = 'waveform-label';
waveformLabel.textContent = 'Breathing rhythm';

const svgNamespace = 'http://www.w3.org/2000/svg';

const waveformSvg = document.createElementNS(
    svgNamespace,
    'svg'
);

waveformSvg.setAttribute('viewBox', '0 0 180 50');
waveformSvg.setAttribute('preserveAspectRatio', 'none');
waveformSvg.setAttribute('aria-hidden', 'true');
waveformSvg.classList.add('waveform-svg');

const waveformPath = document.createElementNS(
    svgNamespace,
    'path'
);

waveformPath.setAttribute('d', 'M 0 25 L 180 25');
waveformPath.classList.add('waveform-path');

waveformSvg.appendChild(waveformPath);
waveformPanel.appendChild(waveformLabel);
waveformPanel.appendChild(waveformSvg);

if (measurementPanel) {
    measurementPanel.appendChild(waveformPanel);
}

let waveformFrame = null;

// Added: breathing measurement acquisition indicator
const acquisitionIndicator = document.createElement('div');
acquisitionIndicator.className = 'acquisition-indicator';
acquisitionIndicator.setAttribute('role', 'status');
acquisitionIndicator.setAttribute('aria-live', 'polite');

const acquisitionSpinner = document.createElement('span');
acquisitionSpinner.className = 'acquisition-spinner';
acquisitionSpinner.setAttribute('aria-hidden', 'true');

const acquisitionText = document.createElement('span');
acquisitionText.className = 'acquisition-text';

acquisitionIndicator.appendChild(acquisitionSpinner);
acquisitionIndicator.appendChild(acquisitionText);

measurementMessage.insertAdjacentElement(
    'afterend',
    acquisitionIndicator
);

let acquisitionTimer = null;
let hasReceivedValidReading = false;

function stopAcquisitionIndicator() {
    clearTimeout(acquisitionTimer);
    acquisitionTimer = null;
    acquisitionIndicator.classList.remove('visible');
}

function startAcquisitionIndicator() {
    clearTimeout(acquisitionTimer);

    hasReceivedValidReading = false;

    acquisitionText.textContent =
        'Detecting your breathing... This may take a little time. Keep still and face the camera.';

    acquisitionIndicator.classList.add('visible');

    acquisitionTimer = setTimeout(() => {
        if (
            currentSessionStatus === 'measuring' &&
            !hasReceivedValidReading
        ) {
            acquisitionText.textContent =
                'Still analysing your breathing. Keep your head and upper chest visible and remain still.';
        }
    }, 15000);
}

function completeAcquisitionIfValid() {
    if (
        !hasReceivedValidReading &&
        currentSessionStatus === 'measuring' &&
        signalQuality.textContent === 'Stable' &&
        element.textContent !== '--'
    ) {
        hasReceivedValidReading = true;
        stopAcquisitionIndicator();
    }
}

// Determine whether the breathing signal is live
function hasLiveBreathingSignal() {
    const rate = Number(element.textContent);

    return (
        currentSessionStatus === 'measuring' &&
        signalQuality.textContent === 'Stable' &&
        element.textContent !== '--' &&
        Number.isFinite(rate) &&
        rate > 0
    );
}

// Animated waveform based on the breathing rate
function animateWaveform(timestamp) {
    if (!hasLiveBreathingSignal()) {
        waveformFrame = null;
        waveformPath.setAttribute('d', 'M 0 25 L 180 25');
        return;
    }

    const rate = Number(element.textContent);
    const phase = (timestamp / 1000) * 2 * Math.PI * (rate / 60);

    let path = '';

    for (let x = 0; x <= 180; x += 3) {
        const angle = (x / 180) * 4 * Math.PI - phase;
        const y = 25 - Math.sin(angle) * 14;

        path += `${x === 0 ? 'M' : 'L'} ${x} ${y} `;
    }

    waveformPath.setAttribute('d', path);
    waveformFrame = requestAnimationFrame(animateWaveform);
}

function updateWaveform() {
    if (hasLiveBreathingSignal()) {
        waveformPanel.classList.add('active');

        if (waveformFrame === null) {
            waveformFrame = requestAnimationFrame(animateWaveform);
        }
    } else {
        waveformPanel.classList.remove('active');

        if (waveformFrame !== null) {
            cancelAnimationFrame(waveformFrame);
            waveformFrame = null;
        }

        // Straight line when no fresh stable measurement exists
        waveformPath.setAttribute('d', 'M 0 25 L 180 25');
    }
}

// Synchronise ripples with the breathing rate
function updateRipples() {
    const rate = Number(element.textContent);
    const hasLiveSignal = hasLiveBreathingSignal();

    if (hasLiveSignal) {
        updateRippleOrigin();

        rippleLayer.style.setProperty(
            '--breath-duration',
            `${60 / rate}s`
        );
    }

    rippleLayer.classList.toggle('active', hasLiveSignal);

    updateWaveform();
}

// Receive actual breathing measurements
function updateBreathingRate(rate) {
    if (typeof rate === 'number' && Number.isFinite(rate)) {
        element.textContent = rate.toFixed(2);

        if (currentSessionStatus === 'measuring') {
            measurementMessage.textContent =
                'Live breathing measurement';
        }
    } else {
        element.textContent = '--';

        if (currentSessionStatus === 'measuring') {
            measurementMessage.textContent =
                'Waiting for a valid breathing signal';
        } else {
            measurementMessage.textContent =
                'Waiting for measurement';
        }
    }

    // Added: complete initial acquisition on first valid reading
    completeAcquisitionIfValid();

    updateRipples();
}

// Discover available cameras
async function loadCameras() {
    try {
        const cameras = await window.pulseFlow.getCameras();

        cameraSelect.replaceChildren();

        if (cameras.length === 0) {
            cameraStatus.textContent = 'No cameras available';

            cameraSelect.add(
                new Option('No cameras found', '')
            );

            startButton.disabled = true;
            return;
        }

        cameras.forEach(function (camera) {
            const option = new Option(camera.name, camera.id);
            cameraSelect.add(option);
        });

        cameraSelect.disabled = false;
        startButton.disabled = false;

        cameraStatus.textContent =
            cameraSelect.selectedOptions[0].textContent;

        validationMessage.textContent =
            'Select a camera and click Start to begin.';

    } catch (error) {
        console.error('Unable to load cameras:', error);

        cameraStatus.textContent = 'Camera detection failed';
        validationMessage.textContent = error.message;

        startButton.disabled = true;
    }
}

// Start measurement
async function startMeasurement() {
    const cameraId = cameraSelect.value;

    if (!cameraId) {
        validationMessage.textContent =
            'Please select a camera.';
        return;
    }

    // Ask for explicit camera consent
    const consentGranted = window.confirm(
        'Allow PulseFlow to use the selected camera ' +
        'for breathing measurement?'
    );

    if (!consentGranted) {
        validationMessage.textContent =
            'Camera access was not authorised.';
        return;
    }

    startButton.disabled = true;
    cameraSelect.disabled = true;
    sessionStatus.textContent = 'Starting...';

    try {
        await window.pulseFlow.startMeasurement(
            cameraId,
            consentGranted
        );
    } catch (error) {
        console.error('Unable to start measurement:', error);

        sessionStatus.textContent = 'Error';
        validationMessage.textContent = error.message;

        startButton.disabled = false;
        cameraSelect.disabled = false;
        stopButton.disabled = true;

        // Added: hide indicator on start error
        stopAcquisitionIndicator();
    }
}

// Stop measurement
async function stopMeasurement() {
    stopButton.disabled = true;
    sessionStatus.textContent = 'Stopping...';

    // Added: stop loading indicator immediately
    stopAcquisitionIndicator();

    try {
        await window.pulseFlow.stopMeasurement();
    } catch (error) {
        console.error('Unable to stop measurement:', error);

        sessionStatus.textContent = 'Error';
        validationMessage.textContent = error.message;
    }
}

// Update session status
function updateSessionStatus(status) {
    currentSessionStatus = status;

    // Hide positioning guidance when not measuring
    if (status !== 'measuring') {
        clearTimeout(guidanceTimeout);
        guidancePopup.classList.remove('visible');
        previousGuidance = '';
    }

    // Added: manage initial measurement acquisition
    if (status === 'measuring') {
        startAcquisitionIndicator();

        // Handle a valid reading that arrived during startup
        completeAcquisitionIfValid();
    } else {
        stopAcquisitionIndicator();
    }

    if (status === 'starting') {
        sessionStatus.textContent = 'Starting...';
        startButton.disabled = true;
        stopButton.disabled = true;
        cameraSelect.disabled = true;
    }

    if (status === 'measuring') {
        sessionStatus.textContent = 'Measuring';
        startButton.disabled = true;
        stopButton.disabled = false;
        cameraSelect.disabled = true;
    }

    if (status === 'stopping') {
        sessionStatus.textContent = 'Stopping...';
        startButton.disabled = true;
        stopButton.disabled = true;
    }

    if (status === 'idle' || status === 'error') {
        sessionStatus.textContent =
            status === 'idle' ? 'Not measuring' : 'Error';

        startButton.disabled = !cameraSelect.value;
        stopButton.disabled = true;
        cameraSelect.disabled = false;

        // Retain the last breathing rate after Stop
        if (status === 'idle') {
            const hasRecordedRate = element.textContent !== '--';

            if (!hasRecordedRate) {
                measurementMessage.textContent =
                    'No measurement recorded';
            } else if (signalQuality.textContent === 'Unverified') {
                measurementMessage.textContent =
                    'Last observed rate - unstable, not verified';
            } else {
                measurementMessage.textContent =
                    'Last valid breathing rate';
            }
        } else {
            measurementMessage.textContent =
                'Measurement unavailable';
        }
    }

    updateRipples();
}

// Update validation guidance
function updateValidationStatus(message) {
    validationMessage.textContent = message;

    if (
        currentSessionStatus === 'measuring' &&
        message &&
        message !== 'Hold still and record.' &&
        message !== 'Measurement stopped.'
    ) {
        showGuidancePopup(message);
    } else {
        clearTimeout(guidanceTimeout);
        guidancePopup.classList.remove('visible');
    }
}

// Signal quality and stale-reading message
function updateSignalQuality(quality) {
    signalQuality.textContent = quality;

    if (currentSessionStatus === 'measuring') {
        if (quality === 'Last valid reading') {
            measurementMessage.textContent =
                'Last valid reading - waiting for fresh data';
        } else if (
            quality === 'Stable' &&
            element.textContent !== '--'
        ) {
            measurementMessage.textContent =
                'Live breathing measurement';
        } else if (
            quality === 'Unavailable' &&
            element.textContent === '--'
        ) {
            measurementMessage.textContent =
                'Waiting for a valid breathing signal';
        }
    }

    // Added: complete initial acquisition on first valid reading
    completeAcquisitionIfValid();

    updateRipples();
}

// Update selected camera
function handleCameraChange() {
    cameraStatus.textContent =
        cameraSelect.selectedOptions[0]?.textContent
        || 'Not selected';
}

// Register event listeners
window.pulseFlow.onBreathingRate(updateBreathingRate);
window.pulseFlow.onValidationStatus(updateValidationStatus);
window.pulseFlow.onSessionStatus(updateSessionStatus);
window.pulseFlow.onSignalQuality(updateSignalQuality);

cameraSelect.addEventListener('change', handleCameraChange);
startButton.addEventListener('click', startMeasurement);
stopButton.addEventListener('click', stopMeasurement);

// Discover cameras on startup
loadCameras();
updateRippleOrigin();
