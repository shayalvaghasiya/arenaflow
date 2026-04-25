# ArenaFlow: Tactical Stadium Operating System

ArenaFlow is a real-time venue intelligence platform optimized for the **Narendra Modi Stadium** in Ahmedabad. It provides high-fidelity telemetry and predictive routing for both fans and stadium operations staff.

## 🚀 Core Features

### 1. High-Fidelity Tactical Map
- **Live Crowding Heatmap**: Real-time visualization of zone density (Normal, Stable, Congested, Critical).
- **Interactive Tiers**: Navigate through three main seating tiers and hospitality boxes.
- **Dynamic Scanning HUD**: Tactical scanning overlay for monitoring stadium sectors.
- **Staff Tracking**: See real-time positions of security and medical units (Staff/Ops views).

### 2. Live Telemetry
- **Match HUD**: Real-time tracking of match minute and event phase (Pre-match, Ongoing, Halftime, Ending).
- **Population Metrics**: Live counter of total stadium attendance synced via socket nodes.
- **Wait Time Predictions**: Instant estimates for food courts, restrooms, and gate entries based on sector load.

### 3. Staff & Operations Node
- **Incident Dispatch**: Rapid reporting for medical, security, fire, and crowd congestion incidents.
- **Command Center**: Global control for stadium-wide alerts and staff coordination.
- **Tactical Feedback**: Direct communication line from staff nodes to the central ops terminal.

### 4. Fan Intelligence (Attendee View)
- **Pathfinder Routing**: Find the quickest gates and facilities based on live crowding data.
- **Facility Status**: Real-time occupancy alerts for restrooms and concession stands.
- **Event Feed**: Global stadium alerts for match updates and safety information.

## 🛠 Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion (motion).
- **Real-time Backend**: Express, Socket.io (Node.js).
- **Visuals**: Lucide Icons, Custom SVG Blueprinting.

## 🔒 Security
- Role-based access control for Operations and Staff terminals.
- Secure tactical communication protocols.
