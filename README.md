# 🌟 Kinetic Gesture Particles - Ultimate Edition

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Tech](https://img.shields.io/badge/Three.js-WebGL-black)
![AI](https://img.shields.io/badge/MediaPipe-Computer%20Vision-blue)

A mesmerizing, interactive 3D particle system controlled entirely by hand gestures.  
This project fuses **Computer Vision (MediaPipe)** with **High-Performance 3D Graphics (Three.js)**  
to create a “Minority Report”-style interface where you can sculpt, explode, and morph digital matter in real time.

---

## ✨ Features

- ⚡ **Real-time Hand Tracking** with high accuracy (MediaPipe)
- 🌌 **3D Particle Physics** (8,000+ particles, velocity, inertia, friction)
- 💡 **Neon Bloom Effects** using UnrealBloomPass
- 🧲 **Physics Interactions**: gravity well, repulsion, elastic scaling
- 🔤 **Text-to-Particle Generator**
- 🎨 **Dynamic Neon Palettes** switchable via gestures

---

## 🎮 Gesture Control Guide

Control the simulation using your webcam. Keep your hands visible and well-lit.

### 1️⃣ Single Hand Gestures

| Gesture | Icon | Action | Description |
|--------|:----:|--------|-------------|
| **Open Hand** | 🖐️ | Rotate View | Move hand to rotate the camera |
| **Tilt Wrist** | ↪️ | 360° Spin | Twist hand left/right |
| **Rock Sign** | 🤘 | Next Shape | Index + Pinky open |
| **Peace Sign** | ✌️ | Swap Colors | Switch neon palettes |
| **Fist** | ✊ | Black Hole | Creates a particle gravity well |

### 2️⃣ Dual Hand Gestures

| Gesture | Icon | Action | Description |
|--------|:----:|--------|-------------|
| **Stretch** | ↔️ | Rubber Band | Pull apart to stretch, push together to compress |
| **Clap** | 🙌 | Sonic Blast | Fast clap creates explosive ripple |

---

## 🛠️ Technology Stack

- **Three.js** – WebGL rendering
- **MediaPipe Hands** – Hand landmark tracking
- **UnrealBloomPass** – Glow effects
- **Tailwind CSS** – UI layout + styling
- **Lucide Icons** – Minimal, clean icon set

---

## 🚀 How to Run Locally

Because the project uses the webcam, it must run on **localhost** or **HTTPS**.

### ▶️ Using VS Code (Recommended)

1. Install the **Live Server** extension  
2. Right-click `index.html` → **Open with Live Server**

You're ready to go.

---

## ⚙️ Customization

Modify settings inside `script.js`:

| Feature | Setting | Notes |
|---------|---------|-------|
| Particle Count | `this.count = 8000;` | Higher = heavier load |
| Bloom Glow | `bloomPass.strength = 1.8;` | Increase for more neon |
| Color Themes | `this.colorList` | Add your own neon palettes |

---

# 🚀 Use Cases & Applications

## 1. Interactive Event Installations
- Wedding centerpiece using **Heart → Flower → “Pour Toi”** transitions  
- Gesture-reactive photo booth effects

## 2. Live Performance & VJing
- Audio-reactive visuals for DJs  
- Gesture-controlled overlays for streamers

## 3. Public Exhibits & Digital Art
- Touchless interactive museum installations  
- Algorithmic visual storytelling (Heartbreak → Healing loops)

## 4. HCI & Research
- Future **touchless UI** prototypes for kiosks  
- Accessibility interfaces for users with limited fine motor control

## 5. STEM Education
- Visualizing **gravity**, **fluid dynamics**, and **3D motion** in real time

---

## 📜 License

This project is open-source.  
Use it freely for learning, portfolios, academic work, or experiments.

**Built with ❤️ using Three.js & MediaPipe.**
