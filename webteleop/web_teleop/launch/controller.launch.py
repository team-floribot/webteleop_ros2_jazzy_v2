from launch import LaunchDescription
from launch.actions import ExecuteProcess # like terminal cmd

def generate_launch_description():  # ROS2 requirements
    return LaunchDescription([
        ExecuteProcess(  # Run a Python module inside your ROS package
            cmd=[
                'python3',
                '-m',
                'web_teleop.controller_node'
            ],
            output='screen',
        )
    ])