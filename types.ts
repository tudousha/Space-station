
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  DOCKING = 'DOCKING',
  STABILIZING = 'STABILIZING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export enum DeviceType {
  MOBILE = 'MOBILE',
  COMPUTER = 'COMPUTER'
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface OrientationData {
  beta: number;  // x-axis tilt
  gamma: number; // y-axis tilt
}

export interface GestureData {
  rotationDelta: number; // calculated spin delta from hand circular motion
}
