FROM ros:jazzy


ENV DEBIAN_FRONTEND=noninteractive

# Force CycloneDDS to avoid Fast-CDR ABI crashes
ENV RMW_IMPLEMENTATION=rmw_cyclonedds_cpp

RUN apt-get update && apt-get install -y \
    ros-jazzy-turtlesim \
    ros-jazzy-rmw-cyclonedds-cpp \
    && rm -rf /var/lib/apt/lists/

ENV QT_QPA_PLATFORM=offscreen

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
