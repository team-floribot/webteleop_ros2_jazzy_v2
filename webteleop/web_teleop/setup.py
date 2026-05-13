from setuptools import setup

package_name = 'web_teleop'

setup(
    name=package_name,
    version='0.0.1',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages',
         ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch',
         ['launch/controller.launch.py']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='you',
    maintainer_email='alzateleon@stud.hs-heilbronn.de',
    description='Web teleoperation controller',
    license='MIT',
    entry_points={
        'console_scripts': [
            'controller_node = web_teleop.controller_node:main',
        ],
    },
)