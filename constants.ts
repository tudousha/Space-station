
export const TARGET_STATION_SPIN = 0.12; // ~70 RPM (radians per frame at 60fps)
export const INITIAL_DISTANCE = 3000; // Starts at 300m
export const APPROACH_SPEED = 0.5; 
export const DOCKING_THRESHOLD_DISTANCE = 50; 
export const SPIN_MATCH_EPSILON = 0.01; 
export const TILT_MATCH_THRESHOLD = 5.0; 
export const TILT_DRIFT_MULTIPLIER = 6.0; // Slightly reduced from 7.0 for finer control
export const MAX_DRIFT_RADIUS = 250; // Reduced from 500 to 250 for a much tighter corridor
export const CIRCULAR_GESTURE_SENSITIVITY = 0.0025;
export const STABILIZATION_DECEL = 0.995; 
export const MISSION_TIME = 150; 

export const STABILIZATION_TARGET_RPM = 202;
// Conversion: RPM to Rad/Frame (at 60fps)
export const STABILIZATION_TARGET_RAD = (STABILIZATION_TARGET_RPM * 2 * Math.PI) / 3600;
