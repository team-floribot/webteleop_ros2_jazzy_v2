# pyright: reportMissingImports=false       
# Avoids Warning ↑

import rclpy    # ROS 2 Python client Library
from rclpy.node import Node
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry       # (for real robot feedback)


class Controller(Node):

    def __init__(self):
        super().__init__("web_controller")  # creates a node with the desired name


        # Declare parameters (with defaults)
        self.declare_parameter("max_linear", 1.0)    # m/s
        self.declare_parameter("max_angular", 1.0)   # rad/s

        self.max_linear = self.get_parameter("max_linear").value
        self.max_angular = self.get_parameter("max_angular").value
        
        self.v = 0.0    # Linear vel
        self.w = 0.0    # Angular vel

        self.create_subscription(  # From web (JS → ROS)
            Twist,              # Message type
            "/web_cmd_vel",
            self.cb,     # self callback
            10
        )


        self.pub_robot = self.create_publisher(      # OUTPUT TO REAL ROBOT
            Twist,
           "/cmd_vel",   # ← CHANGE THIS depending on robot
            10
        )

        # -----------------------------
        # OPTIONAL: FEEDBACK FROM ROBOT
        # -----------------------------

        self.create_subscription(
             Odometry,
             "/odom",    # ← robot position topic
             self.odom_callback,
             10
         )

        self.timer = self.create_timer(0.1, self.loop)   # Every 10Hz → 0.1 seconds

        self.get_logger().info("Controller started")

    def cb(self, msg: Twist):        # Runs when the command arrives
        
        max_l = self.get_parameter("max_linear").value
        max_a = self.get_parameter("max_angular").value

        raw_v = msg.linear.x
        raw_w = msg.angular.z

        # Clamp
        self.v = max(-max_l, min(max_l, raw_v))
        self.w = max(-max_a, min(max_a, raw_w))

        # Log real applied velocity
        #self.get_logger().info(
        #    f"Applied velocity → linear: {self.v:.3f} m/s | angular: {self.w:.3f} rad/s"
        #)

# MAIN LOOP → send commands
    def loop(self):
        
        msg = Twist()
        
        msg.linear.x = self.v       # Publishes to my self.v
        msg.angular.z = self.w
        
        self.pub_robot.publish(msg)    # real robot

    # -----------------------------
    # OPTIONAL: ROBOT FEEDBACK
    # -----------------------------
    def odom_callback(self, msg: Odometry):
            x = msg.pose.pose.position.x
            y = msg.pose.pose.position.y
    #        self.get_logger().info(f"Robot position → x: {x:.2f}, y: {y:.2f}")

def main():
    rclpy.init()
    node = Controller()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == "__main__":
    main()