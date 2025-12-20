
export const TARGET_STATION_SPIN = 0.12; // ~70 RPM (radians per frame at 60fps)
export const INITIAL_DISTANCE = 3000; // Starts at 300m
export const APPROACH_SPEED = 1.0; // Increased from 0.5 for a more dynamic approach
export const DOCKING_THRESHOLD_DISTANCE = 50; 
export const SPIN_MATCH_EPSILON = 0.01; 
export const TILT_MATCH_THRESHOLD = 5.0; 
export const TILT_DRIFT_MULTIPLIER = 6.0; 
export const MAX_DRIFT_RADIUS = 250; 
export const CIRCULAR_GESTURE_SENSITIVITY = 0.0025;
export const STABILIZATION_DECEL = 0.995; 
export const MISSION_TIME = 9999; // Effectively removed via logic change in Game.tsx

export const STABILIZATION_TARGET_RPM = 202;
// Conversion: RPM to Rad/Frame (at 60fps)
export const STABILIZATION_TARGET_RAD = (STABILIZATION_TARGET_RPM * 2 * Math.PI) / 3600;
