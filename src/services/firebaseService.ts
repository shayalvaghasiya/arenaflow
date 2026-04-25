import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  getDocs,
  setDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { io, Socket } from 'socket.io-client';
import { db, auth } from '../lib/firebase';
import { StadiumState, Zone, Alert, StaffMember, StaffInstruction } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // No-op for now to prevent app crash on quota hit
}

class FirebaseStadiumService {
  private stateListeners: ((state: StadiumState) => void)[] = [];
  private alertListeners: ((alerts: Alert[]) => void)[] = [];
  private transitListeners: ((transits: any[]) => void)[] = [];
  private socket: Socket;
  private currentState: StadiumState = {
    zones: {},
    staff: [],
    waitTimes: {},
    instructions: [],
    eventStatus: 'pre-match',
    matchMinute: 0,
    totalAttendees: 0,
    timestamp: Date.now()
  };

  constructor() {
    // Initialize socket connection
    this.socket = io();
    this.initListeners();
  }

  private initListeners() {
    // PRIMARY SOURCE: Socket.io for real-time (FREE)
    this.socket.on('stadium-update', (state: StadiumState) => {
      this.currentState = state;
      this.triggerUpdate();
    });

    this.socket.on('alerts-update', (alerts: Alert[]) => {
      this.alertListeners.forEach(l => l(alerts));
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connection failed, falling back to cached state. Check if server is running on port 3000.');
    });

    // SECONDARY SOURCE: Listen to transit confirmations via Firestore (less frequent)
    // We'll keep this but onSnapshot on a collection that doesn't change every 2s is fine.
    onSnapshot(collection(db, 'transit_confirmations'), (snap) => {
      const transits: any[] = [];
      snap.forEach(doc => {
        transits.push({ id: doc.id, ...doc.data() });
      });
      this.transitListeners.forEach(l => l(transits));
    }, (error) => {
      console.warn('Transit confirmations listener failed');
    });
  }

  private triggerUpdate() {
    this.stateListeners.forEach(l => l(this.currentState));
  }

  onStateUpdate(callback: (state: StadiumState) => void) {
    this.stateListeners.push(callback);
    // Send immediate local state
    if (this.currentState.timestamp > 0) callback(this.currentState);
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== callback);
    };
  }

  onAlertsUpdate(callback: (alerts: Alert[]) => void) {
    this.alertListeners.push(callback);
    return () => {
      this.alertListeners = this.alertListeners.filter(l => l !== callback);
    };
  }

  onTransitUpdate(callback: (transits: any[]) => void) {
    this.transitListeners.push(callback);
    return () => {
      this.transitListeners = this.transitListeners.filter(l => l !== callback);
    };
  }

  // ACTIONS: Use sockets for immediate execution (FREE)
  async dispatchInstruction(staffId: string, message: string) {
    this.socket.emit('dispatch-instruction', { staffId, message });
  }

  async acknowledgeInstruction(staffId: string, instructionId: string) {
    this.socket.emit('acknowledge-instruction', instructionId);
  }

  async setEventStatus(status: StadiumState['eventStatus']) {
    this.socket.emit('set-event-status', status);
  }

  async resolveIncident(incidentId: string) {
    this.socket.emit('resolve-incident', incidentId);
  }

  async replaceZoneCount(zoneId: string, count: number) {
    this.socket.emit('update-zone-count', { zoneId, count });
  }

  async deployStaff(staffId: string, zoneId: string) {
    this.socket.emit('reassign-staff', { staffId, zoneId });
  }

  async reportIncident(staffId: string, zoneId: string, type: string) {
    this.socket.emit('report-incident', { staffId, zoneId, type });
  }

  async confirmTransit(gateId: string, gateName: string) {
    const confirmation = {
      gateId,
      gateName,
      userId: auth.currentUser?.uid || 'anonymous',
      timestamp: { seconds: Math.floor(Date.now() / 1000) },
      id: `local-${Date.now()}`
    };

    // Immediate local feedback
    this.transitListeners.forEach(l => l([confirmation, ...(this.transitListeners[0] as any || [])]));

    try {
      // Still write to Firestore for global transit telemetry visibility
      await addDoc(collection(db, 'transit_confirmations'), {
        ...confirmation,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
       console.warn('Firestore write failed, using local fallback');
    }
  }

  async broadcastAlert(message: string, severity: 'warning' | 'critical') {
    // This could be a socket broadcast
    this.socket.emit('report-incident', { staffId: 'COMMAND', zoneId: 'global', type: severity });
  }

  async resetSimulation() {
    this.socket.emit('set-event-status', 'pre-match');
  }

  async recallAllStaff() {
    this.currentState.staff.forEach(s => {
      this.socket.emit('reassign-staff', { staffId: s.id, zoneId: 'gate-south' });
    });
  }

  async reinforceStaff() {
    // Set all staff to 'active' - currently simple state handled on server
  }

  async getAIAnalysis() {
    const res = await fetch('/api/analyze-crowd', { method: 'POST' });
    return res.json();
  }
}

export const firebaseStadiumService = new FirebaseStadiumService();
