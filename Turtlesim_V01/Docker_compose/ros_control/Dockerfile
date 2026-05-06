FROM ros:jazzy

RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    ros-jazzy-rosbridge-server \
    ros-jazzy-geometry-msgs \
    ros-jazzy-turtlesim \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

COPY controller_node.py /root/controller_node.py
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
