import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import { createServer as createViteServer } from 'vite';
import { StadiumState, Zone, Alert } from './src/types';
import { db } from './src/server/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  const PORT = 3000;

  // Ahmedabad Narendra Modi Stadium Layout Definition
  const zones: Record<string, Zone> = {
    // Inner Ring (Lower Tier)
    'block-a': { id: 'block-a', name: 'Block A', type: 'seating', capacity: 5000, currentCount: 4200, x: 39, y: 71, neighbors: ['block-j', 'block-b', 'presidential-gallery'] },
    'block-b': { id: 'block-b', name: 'Block B', type: 'seating', capacity: 5000, currentCount: 3800, x: 27, y: 59, neighbors: ['block-a', 'block-c', 'block-k'] },
    'block-c': { id: 'block-c', name: 'Block C', type: 'seating', capacity: 5000, currentCount: 4500, x: 27, y: 41, neighbors: ['block-b', 'block-d', 'block-l'] },
    'block-d': { id: 'block-d', name: 'Block D', type: 'seating', capacity: 5000, currentCount: 3200, x: 40, y: 28, neighbors: ['block-c', 'block-e', 'block-m'] },
    'block-e': { id: 'block-e', name: 'Block E', type: 'seating', capacity: 5000, currentCount: 3900, x: 60, y: 28, neighbors: ['block-d', 'block-f', 'block-n'] },
    'block-f': { id: 'block-f', name: 'Block F', type: 'seating', capacity: 5000, currentCount: 4100, x: 73, y: 41, neighbors: ['block-e', 'block-g', 'block-p'] },
    'block-g': { id: 'block-g', name: 'Block G', type: 'seating', capacity: 5000, currentCount: 3500, x: 73, y: 59, neighbors: ['block-f', 'block-h', 'block-q'] },
    'block-h': { id: 'block-h', name: 'Block H', type: 'seating', capacity: 5000, currentCount: 4300, x: 61, y: 71, neighbors: ['block-g', 'block-j', 'block-r'] },

    // Outer Ring (Upper Tier)
    'block-j': { id: 'block-j', name: 'Block J', type: 'seating', capacity: 8000, currentCount: 6500, x: 26, y: 78, neighbors: ['block-a', 'block-k', 'food-j'] },
    'block-k': { id: 'block-k', name: 'Block K', type: 'seating', capacity: 12000, currentCount: 9500, x: 12, y: 50, neighbors: ['block-b', 'block-j', 'block-l'] },
    'block-l': { id: 'block-l', name: 'Block L', type: 'seating', capacity: 10000, currentCount: 8200, x: 25, y: 22, neighbors: ['block-c', 'block-k', 'block-m'] },
    'block-m': { id: 'block-m', name: 'Block M', type: 'seating', capacity: 10000, currentCount: 7800, x: 42, y: 15, neighbors: ['block-d', 'block-l', 'block-n'] },
    'block-n': { id: 'block-n', name: 'Block N', type: 'seating', capacity: 10000, currentCount: 8100, x: 50, y: 12, neighbors: ['block-e', 'block-m', 'block-p'] },
    'block-p': { id: 'block-p', name: 'Block P', type: 'seating', capacity: 10000, currentCount: 8400, x: 69, y: 19, neighbors: ['block-f', 'block-n', 'block-q', 'food-p'] },
    'block-q': { id: 'block-q', name: 'Block Q', type: 'seating', capacity: 12000, currentCount: 9000, x: 88, y: 50, neighbors: ['block-g', 'block-p', 'block-r'] },
    'block-r': { id: 'block-r', name: 'Block R', type: 'seating', capacity: 8000, currentCount: 6200, x: 74, y: 78, neighbors: ['block-h', 'block-q'] },

    // Specialized Sections (Concentric arcs at bottom)
    'presidential-gallery': { id: 'presidential-gallery', name: 'Presidential Gallery', type: 'seating', capacity: 3000, currentCount: 2800, x: 50, y: 81, neighbors: ['block-a', 'block-h', 'presidential-suites'] },
    'presidential-suites': { id: 'presidential-suites', name: 'Presidential Suites', type: 'seating', capacity: 1500, currentCount: 1400, x: 50, y: 88, neighbors: ['presidential-gallery', 'premium-suites'] },
    'premium-suites': { id: 'premium-suites', name: 'Premium Suites', type: 'seating', capacity: 1000, currentCount: 900, x: 50, y: 95, neighbors: ['presidential-suites'] },

    // Exit Gates & Facilities
    'gate-south': { id: 'gate-south', name: 'Gate 1 (South)', type: 'gate', capacity: 10000, currentCount: 1200, x: 50, y: 98, neighbors: ['premium-suites'] },
    'gate-north': { id: 'gate-north', name: 'Gate 2 (North)', type: 'gate', capacity: 10000, currentCount: 800, x: 50, y: 2, neighbors: ['block-n', 'block-m'] },
    'gate-east': { id: 'gate-east', name: 'Gate 3 (East)', type: 'gate', capacity: 10000, currentCount: 950, x: 98, y: 50, neighbors: ['block-q', 'block-p'] },
    'gate-west': { id: 'gate-west', name: 'Gate 4 (West)', type: 'gate', capacity: 10000, currentCount: 700, x: 2, y: 50, neighbors: ['block-k', 'block-l'] },

    'food-north': { id: 'food-north', name: 'North Food Court', type: 'food', capacity: 2000, currentCount: 1800, x: 25, y: 15, neighbors: ['block-l', 'block-m'] },
    'food-south': { id: 'food-south', name: 'South Food Court', type: 'food', capacity: 2000, currentCount: 1500, x: 75, y: 85, neighbors: ['block-r', 'block-h'] },
    'food-j': { id: 'food-j', name: 'West Food Court', type: 'food', capacity: 2000, currentCount: 1200, x: 15, y: 80, neighbors: ['block-j', 'block-k'] },
    'food-p': { id: 'food-p', name: 'East Food Court', type: 'food', capacity: 2000, currentCount: 1400, x: 82, y: 20, neighbors: ['block-p', 'block-q'] },

    // Transit Nodes
    'metro-station': { id: 'metro-station', name: 'Motera Metro', type: 'concourse', capacity: 5000, currentCount: 1200, x: 95, y: 95, neighbors: ['gate-south', 'gate-east'] },
    'parking-a': { id: 'parking-a', name: 'Parking Alpha', type: 'concourse', capacity: 3000, currentCount: 2100, x: 5, y: 95, neighbors: ['gate-south', 'gate-west'] },
  };

  let state: StadiumState = {
    zones,
    waitTimes: {},
    staff: [
      { id: 'S-1', name: 'Security Alpha', role: 'security', zoneId: 'block-a', status: 'active' },
      { id: 'S-2', name: 'Security Beta', role: 'security', zoneId: 'block-n', status: 'active' },
      { id: 'M-1', name: 'Medical Team 1', role: 'medical', zoneId: 'block-e', status: 'active' },
    ],
    instructions: [],
    eventStatus: 'pre-match',
    matchMinute: 0,
    totalAttendees: 0,
    timestamp: Date.now()
  };

  let alerts: Alert[] = [];

  // Seeding/Syncing Firestore with Retries
  const seedAndSync = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Synchronizing with Firestore (Attempt ${i + 1})...`);
        
        // Basic check for database connection
        if (!db) {
          throw new Error('Firestore database object is not initialized');
        }

        const metaRef = db.collection('config').doc('stadium');
        const metaSnap = await metaRef.get();

        if (!metaSnap.exists) {
          console.log('Seeding initial setup...');
          await metaRef.set({
            eventStatus: state.eventStatus,
            matchMinute: state.matchMinute,
            totalAttendees: state.totalAttendees,
            timestamp: state.timestamp
          });

          // Seed Zones
          const batch = db.batch();
          Object.values(zones).forEach(z => {
            batch.set(db.collection('zones').doc(z.id), z);
          });
          // Seed Staff
          state.staff.forEach(s => {
            batch.set(db.collection('staff').doc(s.id), s);
          });
          await batch.commit();
        } else {
          console.log('Merging local state with Firestore...');
          const metaData = metaSnap.data();
          state.eventStatus = metaData?.eventStatus || state.eventStatus;
          state.matchMinute = metaData?.matchMinute || state.matchMinute;

          // Load zones
          const zonesSnap = await db.collection('zones').get();
          zonesSnap.forEach(doc => {
            const z = doc.data() as Zone;
            state.zones[z.id] = z;
          });

          // Load staff
          const staffSnap = await db.collection('staff').get();
          staffSnap.forEach(doc => {
            const s = doc.data() as any;
            const exists = state.staff.find(st => st.id === s.id);
            if (!exists) state.staff.push(s);
          });
        }
        
        console.log('Firestore initialization successful.');
        return; // Success, exit retry loop
      } catch (error: any) {
        console.error(`Attempt ${i + 1} failed:`, error.message);
        if (i === retries - 1) {
          console.error('CRITICAL: All Firestore sync attempts failed. Operating in LOCAL-ONLY mode.');
        } else {
          console.log('Retrying in 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
  };

  await seedAndSync();

  // Firestore Sync Loop
  const persistToFirestore = async () => {
     try {
       if (!db) {
         console.warn('Firestore DB not initialized, skipping sync');
         return;
       }
       const batch = db.batch();
       // Update metadata
       batch.update(db.collection('config').doc('stadium'), {
         eventStatus: state.eventStatus,
         matchMinute: state.matchMinute,
         totalAttendees: state.totalAttendees,
         timestamp: state.timestamp
       });
       // Update zones
       Object.values(state.zones).forEach(z => {
         batch.set(db.collection('zones').doc(z.id), z, { merge: true });
       });
       // Update staff
       state.staff.forEach(s => {
         batch.set(db.collection('staff').doc(s.id), s, { merge: true });
       });
       // Sync alerts
       const alertsRef = db.collection('alerts');
       const oldAlerts = await alertsRef.get();
       oldAlerts.forEach(doc => batch.delete(doc.ref));
       alerts.forEach(a => batch.set(alertsRef.doc(a.id), a));

       await batch.commit();
       console.log(`Firestore Sync Successful [${new Date().toLocaleTimeString()}]`);
     } catch (e) {
       console.error('Firestore sync error:', e);
     }
  };

  // Socket Events (Legacy support or fast bridge)
  io.on('connection', (socket) => {
    socket.on('dispatch-instruction', (instruction: any) => {
      state.instructions.unshift({
        ...instruction,
        id: `inst-${Date.now()}`,
        timestamp: Date.now(),
        status: 'pending'
      });
      io.emit('stadium-update', state);
    });

    socket.on('acknowledge-instruction', (id: string) => {
      const idx = state.instructions.findIndex(i => i.id === id);
      if (idx !== -1) {
        state.instructions[idx].status = 'acknowledged';
        io.emit('stadium-update', state);
      }
    });

    socket.on('set-event-status', (status: any) => {
      state.eventStatus = status;
      state.matchMinute = 0;
      io.emit('stadium-update', state);
    });

    socket.on('resolve-incident', (incidentId: string) => {
      alerts = alerts.filter(a => a.id !== incidentId);
      io.emit('alerts-update', alerts);
    });

    socket.on('update-zone-count', ({ zoneId, count }: any) => {
      if (state.zones[zoneId]) {
        state.zones[zoneId].currentCount = count;
        io.emit('stadium-update', state);
      }
    });

    socket.on('reassign-staff', ({ staffId, zoneId }: any) => {
      const idx = state.staff.findIndex(s => s.id === staffId);
      if (idx !== -1) {
        state.staff[idx].zoneId = zoneId;
        state.instructions.unshift({
          id: `inst-${Date.now()}`,
          staffId,
          message: `REDEPLOYMENT: Proceed to ${state.zones[zoneId]?.name || zoneId} immediately.`,
          timestamp: Date.now(),
          status: 'pending'
        });
        io.emit('stadium-update', state);
      }
    });

    socket.on('report-incident', ({ staffId, zoneId, type }: any) => {
      const staff = state.staff.find(s => s.id === staffId);
      const alert: Alert = {
        id: `incident-${Date.now()}`,
        zoneId: zoneId,
        message: `EMERGENCY [${type.toUpperCase()}]: Reported by ${staff?.name || 'Staff'}`,
        severity: 'incident',
        timestamp: Date.now()
      };
      alerts.unshift(alert);
      io.emit('alerts-update', alerts);
    });
  });

  // Update wait times helper
  const updateWaitTimes = () => {
    let total = 0;
    Object.values(state.zones).forEach(zone => {
      total += zone.currentCount;
      const wait = Math.floor(zone.currentCount / (zone.type === 'food' ? 10 : 40));
      state.waitTimes[zone.id] = {
        zoneId: zone.id,
        minutes: wait,
        status: wait < 5 ? 'low' : wait < 15 ? 'medium' : 'high'
      };
    });
    state.totalAttendees = total;
  };

  updateWaitTimes();

  // Simulation Logic
  setInterval(() => {
    // Match Progression
    state.matchMinute++;
    if (state.eventStatus === 'pre-match' && state.matchMinute > 10) {
       state.eventStatus = 'ongoing';
       state.matchMinute = 0;
    } else if (state.eventStatus === 'ongoing' && state.matchMinute > 45) {
       state.eventStatus = 'halftime';
       state.matchMinute = 0;
    } else if (state.eventStatus === 'halftime' && state.matchMinute > 15) {
       state.eventStatus = 'ongoing';
       state.matchMinute = 45;
    } else if (state.eventStatus === 'ongoing' && state.matchMinute > 90) {
       state.eventStatus = 'ending';
       state.matchMinute = 0;
    } else if (state.eventStatus === 'ending' && state.matchMinute > 20) {
       state.eventStatus = 'post-match';
       state.matchMinute = 0;
    }

    // Phase 1: Fluid movement
    Object.values(state.zones).forEach(zone => {
      const neighbors = zone.neighbors;
      const moveRate = 0.05; // 5% of people move every tick
      const totalMoving = Math.floor(zone.currentCount * moveRate * Math.random());
      
      if (totalMoving > 0) {
        const perNeighbor = Math.floor(totalMoving / neighbors.length);
        neighbors.forEach(nId => {
          if (state.zones[nId] && zone.currentCount >= perNeighbor) {
            state.zones[zone.id].currentCount -= perNeighbor;
            state.zones[nId].currentCount += perNeighbor;
          }
        });
      }
    });

    // Phase 2: Scenario logic
    const hour = new Date().getHours();
    // Simulate pre-match rush if it's "early"
    if (state.eventStatus === 'pre-match') {
      ['gate-south', 'gate-north', 'gate-east', 'gate-west'].forEach(gateId => {
        if (state.zones[gateId]) {
          state.zones[gateId].currentCount += Math.floor(Math.random() * 50);
        }
      });
    }

    // Phase 3: Cleanup and Bound checks
    Object.values(state.zones).forEach(zone => {
      if (zone.currentCount < 0) zone.currentCount = 0;
    });

    updateWaitTimes();

    // Check for alerts
    const newAlerts: Alert[] = [];
    Object.values(state.zones).forEach(zone => {
      const density = zone.currentCount / zone.capacity;
      if (density > 0.95) {
        newAlerts.push({
          id: `alert-${zone.id}-${Date.now()}`,
          zoneId: zone.id,
          message: `CRITICAL: Overcrowding at ${zone.name}`,
          severity: 'critical',
          timestamp: Date.now()
        });
      } else if (density > 0.8) {
        newAlerts.push({
          id: `alert-${zone.id}-${Date.now()}`,
          zoneId: zone.id,
          message: `Heavy traffic at ${zone.name}`,
          severity: 'warning',
          timestamp: Date.now()
        });
      }
    });

    // Keep unique active alerts for zones
    alerts = newAlerts;

    state.timestamp = Date.now();
    io.emit('stadium-update', state);
    io.emit('alerts-update', alerts);

    // Sync to Firestore for production persistence
    persistToFirestore();
  }, 2000);

  // API Routes
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  
  app.get('/api/state', (req, res) => {
    res.json(state);
  });

  app.post('/api/analyze-crowd', express.json(), async (req, res) => {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `
        You are a Stadium Operations AI. Analyze the current stadium status and provide 3 tactical recommendations.
        Event Status: ${state.eventStatus}
        Match Minute: ${state.matchMinute}
        Total Attendees: ${state.totalAttendees}
        
        Zones with high density (>80%):
        ${Object.values(state.zones).filter(z => z.currentCount / z.capacity > 0.8).map(z => `${z.name}: ${Math.round(z.currentCount / z.capacity * 100)}%`).join(', ')}
        
        Active Alerts:
        ${alerts.map(a => a.message).join(', ')}
        
        Available Staff:
        ${state.staff.filter(s => s.status === 'active').map(s => `${s.name} at ${s.zoneId}`).join(', ')}

        Provide response in JSON format:
        {
          "summary": "Short 1-sentence assessment",
          "recommendations": [
            { "title": "...", "action": "...", "priority": "high|medium|low" }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const jsonResponse = result.response.text().replace(/```json|```/g, '').trim();
      res.json(JSON.parse(jsonResponse));
    } catch (error) {
      console.error('AI Analysis Error:', error);
      res.status(500).json({ error: 'Failed to generate analysis' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
