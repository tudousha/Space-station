# ENDURANCE: ORBITAL DOCKING SIMULATOR

> *"It's not impossible. It's necessary."*

**ENDURANCE** is a high-fidelity, browser-based space flight simulation that challenges pilots to perform one of the most dangerous maneuvers in orbital mechanics: docking with a rapidly spinning space station. Inspired by the cinematic tension of hard sci-fi, the simulator puts you in the cockpit of a Ranger spacecraft tasked with saving the mission.

## 🚀 MISSION OVERVIEW
The Endurance station is spinning at a critical velocity to maintain artificial gravity. To dock, you must match its angular momentum perfectly. Failure to synchronize will result in catastrophic hull failure upon contact.

### Core Objectives:
1.  **Rotation Synchronization**: Match your ship's RPM with the station's spin.
2.  **Axial Alignment**: Maintain a perfect vector toward the docking port.
3.  **Proximity Management**: Approach the station within the safety corridor.
4.  **Stabilization Protocol**: Once docked, initiate counter-thrust to stop the combined spin.

---

## 🎮 CONTROLS

### Standard Sequence (Recommended)
*   **Rotation Control**: 
    *   **Desktop**: Use the **Mouse Wheel** or **Click-and-Drag** horizontally to adjust RPM.
    *   **Mobile**: **Swipe horizontally** to calibrate angular velocity.
*   **Axial Stability**: 
    *   **Desktop**: Move the **Mouse** to align your reticle with the center of the station.
    *   **Mobile**: **Tilt your device** (Gyroscope) to correct drift.

### Gesture Interface (Experimental)
*   **Camera Sync**: Use circular hand motions to adjust ship rotation.
*   **Tracking**: MediaPipe-powered computer vision tracks your finger position to translate physical movement into thruster bursts.

---

## 🛠 TECHNICAL SPECIFICATIONS
The simulator features a "NASA-Brutalist" HUD designed for maximum data density and immersion:
*   **Target Velocity**: 120 RPM (Initial).
*   **Sync Epsilon**: 98% accuracy required for docking engagement.
*   **Vector Drift**: Tightly monitored axial alignment with boundary violation alerts.
*   **Audio Engine**: Dynamic tension-based soundtrack (procedural bass layers and proximity alerts).

---

## 🌌 VISUAL AESTHETICS
*   **Cinematic HUD**: Real-time technical readouts, segmented progress meters, and technical corner brackets.
*   **CRT Simulation**: Authentic scanlines and radiation-induced flicker animations.
*   **Deep Space Environment**: Layered starfields with parallax effects and procedural nebulae.

---

**STATUS: TERMINAL_STANDBY**  
**OS: NASA_RANGER_V4.2**  
*Mission Protocol 94: No time for caution.*
