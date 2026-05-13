#!/bin/bash
set -e

source /opt/ros/jazzy/setup.bash

if [ -f /ws/install/setup.bash ]; then
    source /ws/install/setup.bash
fi

echo "[entrypoint] Starting frontend web server..."
python3 -m http.server 5500 --bind 0.0.0.0 --directory /ws/webteleop/app_frontend &

echo "[entrypoint] Starting rosbridge..."
ros2 launch rosbridge_server rosbridge_websocket_launch.xml &

# Give rosbridge a moment to come up
sleep 2

echo "[entrypoint] Starting web controller..."
ros2 launch web_teleop controller.launch.py
