// Connection state of a paired device as seen from the local machine.
//
//   connecting — handshake in flight (1s after appearance), shows a spinner
//   online     — peer reachable, models browseable
//   offline    — peer hasn't reported in for IDLE_THRESHOLD_MS; grey state
//
// We don't model "error" as a distinct status — connection errors collapse
// into offline in the mock since there's no real network to surface them.
export type DeviceStatus = 'connecting' | 'online' | 'offline';
