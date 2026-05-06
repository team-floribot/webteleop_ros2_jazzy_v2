/* -----------------------------
   ROS WEB CONTROLLER
   David Santiago ALzate Leon - 219037
   Seminararbeit SS26
----------------------------- */

/* -----------------------------
   GLOBAL VARIABLES
----------------------------- */
let ros = null;
let webCmdVel = null;           //cmd_vel from Websocket
let isConnected = false;
let emergencyActive = false;        // Block all movement when active

/* -------- 10 Hz COMMAND LOOP -------- */
const CMD_RATE_HZ = 10;
let cmdTimer = null;

let desiredLinear = 0.0;
let desiredAngular = 0.0;

/* -----------------------------
   DOM ELEMENTS - update UI based on ROS events or user actions
----------------------------- */

const connectBtn = document.getElementById("ConnectBtn");
const statusText = document.getElementById("status");

const modeButtons = document.querySelectorAll(".mode-btn");

// Joystick & emergency
const joyKnob = document.getElementById("joyKnob");
const emergencyBtn = document.getElementById("emergencyBtn");

/* -----------------------------
   SETTINGS PANEL ELEMENTS
----------------------------- */
const openSettingsBtn = document.getElementById("openSettings");
const settingsPanel = document.getElementById("settingsPanel");
const settingsOverlay = document.getElementById("settingsOverlay");

const maxLinearInput = document.getElementById("maxLinearInput");
const maxAngularInput = document.getElementById("maxAngularInput");

const speedLimitSlider = document.getElementById("speedLimit");
const speedLimitValue = document.getElementById("speedLimitValue");

const useLocalhostCheckbox = document.getElementById("useLocalhost");
const rosIpInput = document.getElementById("rosIpInput");

const settingsConnectBtn = document.getElementById("ConnectBtn");
const settingsStatusText = document.getElementById("settingsStatus");

const padSizeSlider = document.getElementById("padSizeSlider");
const padSizeValue  = document.getElementById("padSizeValue")
/* -----------------------------
   SETTINGS PANEL TOGGLE
----------------------------- */
if (openSettingsBtn && settingsPanel && settingsOverlay) {
    openSettingsBtn.addEventListener("click", () => {
        // console.log("SETTINGS CLICKED"); 
        settingsPanel.classList.add("open");
        settingsOverlay.classList.add("open");
    });

    settingsOverlay.addEventListener("click", () => {
        settingsPanel.classList.remove("open");
        settingsOverlay.classList.remove("open");
    });
}

/* -----------------------------
   ROS BRIDGE IP SELECTION
----------------------------- */
function updateIpInputState() {
    if (!useLocalhostCheckbox || !rosIpInput) return;

    if (useLocalhostCheckbox.checked) {
        rosIpInput.value = "localhost";
        rosIpInput.disabled = true;
    } else {
        rosIpInput.value = "";
        rosIpInput.disabled = false;
        rosIpInput.focus();
    }
}

useLocalhostCheckbox.addEventListener("change", updateIpInputState);
updateIpInputState();

/* -----------------------------
   ROS LOGGING
----------------------------- */
function publishLog(text) {
    if (!ros || !isConnected) return;

    const logTopic = new ROSLIB.Topic({   // Library called in html
        ros: ros,
        name: "/webapp_log",
        messageType: "std_msgs/msg/String"
    });

    logTopic.publish(new ROSLIB.Message({ data: text }));
    console.log("LOG:", text);
}

/* -----------------------------
   CONNECT / DISCONNECT TO ROS
----------------------------- */
function toggleConnection() {

    /* ================= USER CONNECT CLICK LOG ================= */
    console.log("🟦 CONNECT BUTTON CLICKED");
    console.log("Mode:", document.querySelector(".mode-btn.active")?.dataset.mode);
    console.log("Max Linear Velocity:", maxLinearInput.value,"m/s");
    console.log("Max Angular Velocity:", maxAngularInput.value,"rad/s");
    console.log("Speed Limit (%):", speedLimitSlider.value);
    console.log("Use Localhost:", useLocalhostCheckbox.checked);
    console.log("ROS IP Input:", rosIpInput.value);
     /* ========================================================== */

    if (!isConnected) {

        const ip = useLocalhostCheckbox.checked
            ? "10.2.7.151" //10.148.245.131"              // IP from Local Hotspot → changed if needed
            : rosIpInput.value.trim();

        if (!ip) {
            alert("Please enter a ROS Bridge IP address.");
            return;
        }

        const wsUrl = `ws://${ip}:9090`;

        console.log("Connecting to ROS Bridge");
        console.log("→ Using IP:", ip);
        console.log("→ WebSocket URL:", wsUrl);
        console.log("==============================================");

        ros = new ROSLIB.Ros({ url: wsUrl });

        ros.on("connection", () => {     //ros.on event listener atatched to ROSLIB:Ros
            isConnected = true;

            statusText.textContent = "✅ Connected";
            settingsStatusText.textContent = "✅ Connected";
            settingsConnectBtn.textContent = "Disconnect";

            webCmdVel = new ROSLIB.Topic({
                ros: ros,
                name: "/web_cmd_vel",
                messageType: "geometry_msgs/msg/Twist"
            });

            
            console.log("Connected to RO starting video placeholder");
            startVideoPlaceholder();
            connectTurtlePoseSubscriber();
            startCmdLoop();                             //  START 10 Hz LOOP
            publishLog("Connected from Web-app");
        });

        ros.on("error", err => {
            statusText.textContent = "❌ Connection error";
            settingsStatusText.textContent = "❌ Connection error";
            console.error(err);
        });

        ros.on("close", () => {
            isConnected = false;

            
            console.log("Disconnected stopping video placeholder");
            stopVideoPlaceholder();
            stopCmdLoop();

            statusText.textContent = "🔌 Disconnected";
            settingsStatusText.textContent = "🔌 Disconnected";
            settingsConnectBtn.textContent = "Connect";

            ros = null;
        });

    } else {
        publishLog("Disconnected from Web UI");
        ros.close();
    }
}

settingsConnectBtn.addEventListener("click", toggleConnection);

/* -----------------------------
   10 Hz CMD_VEL LOOP
----------------------------- */
function startCmdLoop() {
    if (cmdTimer) return;

    cmdTimer = setInterval(() => {
        if (!webCmdVel || !isConnected || emergencyActive) return;

        linearX = desiredLinear * Number(maxLinearInput.value);        // Replace by Pose from robot
        angularZ = desiredAngular * Number(maxAngularInput.value);
       
        webCmdVel.publish(new ROSLIB.Message({
            linear: { x: desiredLinear, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: desiredAngular }
        }));

        batteryPercent = Math.abs(desiredLinear) * 100 + 25; //Place holder
        updateStatusBar();

    }, 1000 / CMD_RATE_HZ); //set Interva is in miliseconds
}

function stopCmdLoop() {
    if (cmdTimer) {
        clearInterval(cmdTimer);
        cmdTimer = null;
    }
    desiredLinear = 0;
    desiredAngular = 0;
}

/* ---------------------------------------
   STATUS BAR
--------------------------------------- */
let linearX = 0;
let angularZ = 0;
let batteryPercent = 0;

function updateStatusBar() {

    /* Update linear + angular velocity values */
    document.getElementById("statusLinear").textContent = linearX.toFixed(3);       // Gotten from status bar
    document.getElementById("statusAngular").textContent = angularZ.toFixed(3);

    /* Update battery */
    document.getElementById("batteryValue").textContent = batteryPercent.toFixed(0) + "%";

    const bars = document.querySelectorAll(".battery-bars .bar");

    const activeBars = Math.ceil(batteryPercent / 25);

    bars.forEach((bar, i) => {
        bar.classList.toggle("active", i < activeBars);
    });

    /*  Battery color logic */
    let color = "#22c55e";

    if (batteryPercent <= 25) color = "#ef4444";
    else if (batteryPercent <= 50) color = "#facc15";

    bars.forEach((bar, i) => {
        bar.style.background = i < activeBars ? color : "#475569";
    });
}

updateStatusBar();

/* -----------------------------
   SPEED LIMIT SLIDER
----------------------------- */
speedLimitValue.textContent = speedLimitSlider.value + "%";

speedLimitSlider.addEventListener("input", () => {
    speedLimitValue.textContent = speedLimitSlider.value + "%";
});

/* -----------------------------
   EMERGENCY STOP
----------------------------- */
function stopMovement() {
    desiredLinear = 0;
    desiredAngular = 0;
    updateStatusBar();
    publishLog("Stop");
}

emergencyBtn.addEventListener("click", () => {
    emergencyActive = !emergencyActive;

    if (emergencyActive) {
        emergencyBtn.classList.add("active");
        emergencyBtn.textContent = "STOPPED";
        stopMovement();
        resetJoystick();
    } else {
        emergencyBtn.classList.remove("active");
        emergencyBtn.textContent = "STOP";
    }
});

/* -----------------------------
   MODE BUTTONS
----------------------------- */
modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {

        modeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const mode = btn.dataset.mode;

        // Placeholder behavior
        if (mode === "1") {
            console.log("Mode 1 pressed_placeholder");
        } else if (mode === "2") {
            console.log("Mode 2 pressed_placeholder");
        } else if (mode === "3") {
            console.log("Mode 3 pressed_placeholder");
        }
    });
});

/* -----------------------------
   JOYSTICK CONTROLS
----------------------------- */
const joystick = document.querySelector(".joystick");
const joyBase = document.querySelector(".joy-base");

let dragging = false;
let centerX = 0;
let centerY = 0;

let MAX_RADIUS = Number(PadSize.value);

padSizeValue.textContent = PadSize.value;

PadSize.addEventListener("input", () => {
    MAX_RADIUS = Number(PadSize.value);
    padSizeValue.textContent = PadSize.value;
});

const DEADZONE = 10;

joystick.addEventListener("touchstart", e => e.preventDefault(), { passive: false });

joystick.addEventListener("pointerdown", e => {
    if (!isConnected || emergencyActive) return;

    const rect = joystick.getBoundingClientRect();
    centerX = e.clientX - rect.left;
    centerY = e.clientY - rect.top;

    // BASE (transform-based)
    
    const diameter = MAX_RADIUS * 2;

    joyBase.style.width  = diameter + "px";
    joyBase.style.height = diameter + "px";

    joyBase.style.left = centerX + "px";
    joyBase.style.top  = centerY + "px";

    joyKnob.style.left = (centerX - joyKnob.offsetWidth / 2) + "px";
    joyKnob.style.top  = (centerY - joyKnob.offsetHeight / 2) + "px";

    joyBase.style.display = "block";
    joyKnob.style.display = "block";

    dragging = true;
    joyKnob.setPointerCapture(e.pointerId);
});

document.addEventListener("pointermove", e => {
    if (!dragging || emergencyActive) return;

    const rect = joystick.getBoundingClientRect();
    let dx = e.clientX - rect.left - centerX;
    let dy = e.clientY - rect.top - centerY;

    // TRUE SQUARE CLAMP
    dx = Math.max(-MAX_RADIUS, Math.min(MAX_RADIUS, dx));
    dy = Math.max(-MAX_RADIUS, Math.min(MAX_RADIUS, dy));

    if (Math.abs(dx) < DEADZONE) dx = 0;
    if (Math.abs(dy) < DEADZONE) dy = 0;

    joyKnob.style.left = (centerX + dx - joyKnob.offsetWidth / 2) + "px";
    joyKnob.style.top  = (centerY + dy - joyKnob.offsetHeight / 2) + "px";

    const velScale = speedLimitSlider.value / 100;

    desiredLinear  = -dy / MAX_RADIUS * velScale;
    desiredAngular = -dx / MAX_RADIUS * velScale;
});

document.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    stopMovement();
    resetJoystick();
});

function resetJoystick() {
    joyBase.style.display = "none";
    joyKnob.style.display = "none";
}


/* -----------------------------
   VIDEO PLACEHOLDER
----------------------------- */

const videoFrames = [
    "assets/bot_live.png",
    "assets/bot_live2.png",
    "assets/bot_live3.png"
];

let videoIndex = 0;
let videoTimer = null;

function startVideoPlaceholder() {
    if (videoTimer) return;

    videoTimer = setInterval(() => {
        videoIndex = (videoIndex + 1) % videoFrames.length;
        document.getElementById("videoFeed").src = videoFrames[videoIndex];
    }, 2000); // in ms
}

function stopVideoPlaceholder() {
    if (!videoTimer) return;
    clearInterval(videoTimer);
    videoTimer = null;
    document.getElementById("videoFeed").src = "assets/disconnected.png"; 
}

/* -----------------------------
   TURTLESIM CANVAS SETUP
----------------------------- */
const turtleCanvas = document.getElementById("turtleCanvas");
const turtleCtx = turtleCanvas.getContext("2d");

function resizeTurtleCanvas() {
    turtleCanvas.width = turtleCanvas.offsetWidth;
    turtleCanvas.height = turtleCanvas.offsetHeight;
}

window.addEventListener("resize", resizeTurtleCanvas);
resizeTurtleCanvas();

/* -----------------------------
   TURTLESIM POSE SUBSCRIBER
----------------------------- */
let turtlePose = null;

function connectTurtlePoseSubscriber() {
    const poseTopic = new ROSLIB.Topic({
        ros: ros,
        name: "/turtle1/pose",
        messageType: "turtlesim/msg/Pose"
    });

    poseTopic.subscribe(msg => {
        turtlePose = msg;
        drawTurtleSim();
    });

    console.log(" Subscribed to /turtle1/pose");
}

/* -----------------------------
   TURTLESIM RENDERER
----------------------------- */
function drawTurtleSim() {
    if (!turtlePose) return;

    const ctx = turtleCtx;
    const w = turtleCanvas.width;
    const h = turtleCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // turtlesim world size = 11 x 11
    const scaleX = w / 11;
    const scaleY = h / 11;

    const x = turtlePose.x * scaleX;
    const y = h - turtlePose.y * scaleY;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-turtlePose.theta);

    // Turtle body
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // Direction indicator
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();

    ctx.restore();
}
