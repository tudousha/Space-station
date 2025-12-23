
export const INITIAL_STATION_RPM = 120;
export const INITIAL_SHIP_RPM = 22;

export const TARGET_STATION_SPIN = (INITIAL_STATION_RPM * 2 * Math.PI) / 3600; // 120 RPM
export const INITIAL_SHIP_SPIN = (INITIAL_SHIP_RPM * 2 * Math.PI) / 3600; // 22 RPM

export const INITIAL_DISTANCE = 3000; // Starts at 300m
export const APPROACH_SPEED = 1.0; 
export const DOCKING_THRESHOLD_DISTANCE = 50; 
// Tightened tolerances for 98% accuracy
export const SPIN_MATCH_EPSILON = 0.004; 
export const TILT_MATCH_THRESHOLD = 0.3; 
export const TILT_DRIFT_MULTIPLIER = 6.0; 
export const MAX_DRIFT_RADIUS = 250; 
export const CIRCULAR_GESTURE_SENSITIVITY = 0.0025;
export const STABILIZATION_DECEL = 0.995; 
export const MISSION_TIME = 9999; 

export const STABILIZATION_TARGET_RPM = 22;
// Conversion: RPM to Rad/Frame (at 60fps)
export const STABILIZATION_TARGET_RAD = (STABILIZATION_TARGET_RPM * 2 * Math.PI) / 3600;
