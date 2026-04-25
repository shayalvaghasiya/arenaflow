# ArenaFlow: Tactical Stadium Operating System

**ArenaFlow** is a next-generation real-time venue intelligence platform optimized for the **Narendra Modi Stadium** in Ahmedabad. It serves as a unified digital twin, providing high-fidelity telemetry, predictive crowd analytics, and tactical command capabilities to ensure seamless flow and safety for tens of thousands of spectators.

---

### 🌐 Live Application
Access the platform here: [**https://arenaflow-624652695368.asia-south1.run.app/**](https://arenaflow-624652695368.asia-south1.run.app/)

---

## 👥 User Profiles & Workflows

### 1. Operations Command (Ops Center)
The central nervous system of the stadium. Operations staff monitor the "Global Surveillance Map" to identify bottlenecks and incidents before they escalate.
*   **Key Tasks**: Incident resolution, staff dispatching, global alerts, and AI-assisted egress planning.
*   **Workflow**: Monitors live density heatmaps -> Identifies "Critical" sectors -> Dispatches nearby Security/Medical units -> Broadcasts evacuation or rerouting instructions.

### 2. Field Units (Staff View)
Localized tactical nodes for ground personnel (Security, Medical, Facility).
*   **Key Tasks**: Reporting field incidents, acknowledging command orders, and managing sector-level entry/exit through tactical overrides.
*   **Workflow**: Receives "Respond to Gate 4" instruction -> Updates status to "Responding" -> Resolves incident on-site -> Reports sector as "Stabilized".

### 3. Fans & Spectators (Attendee View)
A personal guidance system designed to minimize wait times and optimize the stadium experience.
*   **Key Tasks**: Finding the fastest exits, checking restroom/food stall wait times, and receiving real-time safety updates.
*   **Workflow**: Views current seating area density -> Gets AI-recommended exit route -> Confirms transit signal (telemetry) back to Ops -> Reaches destination via least-congested path.

---

## 🚀 Core Features

### 🗺️ High-Fidelity Tactical Map
*   **Live Crowding Heatmap**: Real-time zone density visualization (Normal, Stable, Congested, Critical).
*   **Interactive Tiers**: Multi-level navigation across tiers, hospitality boxes, and concourses.
*   **Dynamic Scanning HUD**: Tactical overlay for granular monitoring of stadium nodes.
*   **Real-time Geo-Presence**: Live tracking of security, medical, and facility units across all views.

### 📊 Precision Telemetry & Analytics
*   **Live Population Metrics**: Dynamic spectator counter synced via real-time socket nodes.
*   **Wait Time Predictions**: Instant AI-driven estimates for concession stands, restrooms, and gates.
*   **Match Pulse HUD**: Real-time tracking of match state (Pre-match, Ongoing, Halftime, etc.).
*   **Egress Signal Ticker**: Predictive bottleneck detection based on "Transit Confirmations" from fans.

### 🛡️ Tactical Command & Safety
*   **Incident Hub**: Centralized reporting for Security, Medical, and Fire emergencies.
*   **AI Crowd Analytics**: Theoretical load-balancing models that propose tactical redeployments.
*   **Inter-Node Communication**: Seamless instruction flow between the Command Center and Field Units.
*   **Infrastructure Overrides**: Manual "Open Gate" and "Lockdown" capabilities for emergency management.
*   **Persistent Critical Alerts**: Unmissable visual and audio cues for high-priority incidents in the Ops Center.

---

## 🛠 Tech Stack
*   **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion (motion).
*   **Real-time Backend**: Express, Socket.io (Node.js).
*   **Intelligence**: Google Gemini-Flash (AI Crowd Analysis & Recommendations).
*   **Visuals**: Lucide Icons, Tactical SVG Layering.

---

## 🔒 Security & Reliability
*   **Role-Based Access Control**: Domain-specific terminals for Operations and Field Staff.
*   **Resilient Socket Nodes**: Optimized for high-concurrency event telemetry.
*   **Audit Logging**: Real-time syncing of all instructions and incident resolutions.
