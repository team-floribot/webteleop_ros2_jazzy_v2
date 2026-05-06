#!/bin/bash

source /opt/ros/jazzy/setup.bash

echo "Starting rosbridge..."
ros2 launch rosbridge_server rosbridge_websocket_launch.xml &

sleep 2

echo "Starting controller node..."
python3 /root/controller_node.py