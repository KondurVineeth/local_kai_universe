# Using LM Link

## Overview

With LM Link, you can leverage a model loaded on a remote device as if it were local — from any machine on the same link. This extends naturally to the REST API and SDK: "your laptop can make requests to `localhost` and have them served by a powerful remote machine on your network."

Requests to `localhost` continue functioning normally. ZL Universe internally utilizes the model on the remote device as though it were loaded locally. When models exist on multiple devices, the REST API will use the model on the preferred device.

The preferred device setting operates on a per-machine basis. Each device on the link independently controls which remote machine it prefers. Refer to the documentation on setting a preferred device for additional details.

## Use the REST API as Normal

Employ the REST API exactly as you would with a local setup. Consult the [REST API docs](/docs/developer/rest) for comprehensive usage information.

For troubleshooting assistance, join the project's Discord community.
