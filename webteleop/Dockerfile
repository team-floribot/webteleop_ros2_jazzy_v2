
FROM ros:jazzy

# Prevents hanging installs
ENV DEBIAN_FRONTEND=noninteractive     
SHELL ["/bin/bash", "-c"]              

# ----------------------------
# System + ROS build tooling
# ----------------------------
RUN apt-get update && apt-get install -y \
    python3-colcon-common-extensions \
    python3-pip \
    git \
    ros-jazzy-rmw-fastrtps-cpp \
    ros-jazzy-rosbridge-server \
    && rm -rf /var/lib/apt/lists/*

# ----------------------------
# Python deps for web backend
# ----------------------------
RUN pip install --no-cache-dir --break-system-packages \
    fastapi \
    "uvicorn[standard]"

# ----------------------------
# ROS 2 workspace
# ----------------------------
WORKDIR /ws/src

# Copy YOUR ROS package
COPY webteleop/web_teleop /ws/src/web_teleop
# Copy frontend
COPY webteleop/app_frontend /ws/webteleop/app_frontend

WORKDIR /ws
RUN source /opt/ros/jazzy/setup.bash && \
    colcon build --symlink-install

# ----------------------------
# Environment auto-source
# ----------------------------
RUN echo "source /opt/ros/jazzy/setup.bash" >> /root/.bashrc && \
    echo "source /ws/install/setup.bash" >> /root/.bashrc

# ----------------------------
# Entrypoint
# ----------------------------
COPY webteleop/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

# ----------------------------
# Start your controller
# ----------------------------
# CMD ["ros2", "launch", "ros_control", "controller.launch.py"]