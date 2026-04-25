import { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where,
  getDocs,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { StadiumState, Zone, Alert, StaffMember, StaffInstruction, WaitTime } from '../types';

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
  throw new Error(JSON.stringify(errInfo));
}

class FirebaseStadiumService {
  private stateListeners: ((state: StadiumState) => void)[] = [];
  private alertListeners: ((alerts: Alert[]) => void)[] = [];
  private transitListeners: ((transits: any[]) => void)[] = [];
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
    this.initListeners();
  }

  private initListeners() {
    // Listen to metadata
    onSnapshot(doc(db, 'config', 'stadium'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        this.currentState = { ...this.currentState, ...data };
        this.triggerUpdate();
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'config/stadium'));

    // Listen to zones
    onSnapshot(collection(db, 'zones'), (snap) => {
      const zones: Record<string, Zone> = {};
      snap.forEach(doc => {
        zones[doc.id] = doc.data() as Zone;
      });
      this.currentState.zones = zones;
      this.triggerUpdate();
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'zones'));

    // Listen to staff
    onSnapshot(collection(db, 'staff'), (snap) => {
      const staff: StaffMember[] = [];
      snap.forEach(doc => {
        staff.push(doc.data() as StaffMember);
      });
      this.currentState.staff = staff;
      this.triggerUpdate();
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'staff'));

    // Listen to alerts
    onSnapshot(collection(db, 'alerts'), (snap) => {
      const alerts: Alert[] = [];
      snap.forEach(doc => {
        alerts.push(doc.data() as Alert);
      });
      this.alertListeners.forEach(l => l(alerts));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'alerts'));

    // Listen to transit confirmations
    onSnapshot(collection(db, 'transit_confirmations'), (snap) => {
      const transits: any[] = [];
      snap.forEach(doc => {
        transits.push({ id: doc.id, ...doc.data() });
      });
      this.transitListeners.forEach(l => l(transits));
    }, (error) => {
      // Non-critical if this fails
      console.warn('Transit confirmations listener failed - likely Firebase missing');
    });
  }

  private triggerUpdate() {
    this.stateListeners.forEach(l => l(this.currentState));
  }

  onStateUpdate(callback: (state: StadiumState) => void) {
    this.stateListeners.push(callback);
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

  async dispatchInstruction(staffId: string, message: string) {
    const id = `inst-${Date.now()}`;
    const instr: StaffInstruction = {
      id,
      staffId,
      message,
      timestamp: Date.now(),
      status: 'pending'
    };
    await setDoc(doc(db, `staff/${staffId}/instructions`, id), instr);
  }

  async acknowledgeInstruction(staffId: string, instructionId: string) {
    await updateDoc(doc(db, `staff/${staffId}/instructions`, instructionId), {
      status: 'acknowledged'
    });
  }

  async setEventStatus(status: StadiumState['eventStatus']) {
    await updateDoc(doc(db, 'config', 'stadium'), {
      eventStatus: status,
      matchMinute: 0
    });
  }

  async resolveIncident(incidentId: string) {
    await deleteDoc(doc(db, 'alerts', incidentId));
  }

  async replaceZoneCount(zoneId: string, count: number) {
    await updateDoc(doc(db, 'zones', zoneId), {
      currentCount: count
    });
  }

  async deployStaff(staffId: string, zoneId: string) {
    await updateDoc(doc(db, 'staff', staffId), {
      zoneId
    });
    // Also send an automated instruction
    await this.dispatchInstruction(staffId, `REDEPLOYMENT: Proceed to assigned sector immediately.`);
  }

  async reportIncident(staffId: string, zoneId: string, type: string) {
    const id = `incident-${Date.now()}`;
    const alert: Alert = {
      id,
      zoneId,
      message: `EMERGENCY [${type.toUpperCase()}] reported by staff`,
      severity: 'incident',
      timestamp: Date.now()
    };
    await setDoc(doc(db, 'alerts', id), alert);
  }

  async confirmTransit(gateId: string, gateName: string) {
    const confirmation = {
      gateId,
      gateName,
      userId: auth.currentUser?.uid || 'anonymous',
      timestamp: { seconds: Math.floor(Date.now() / 1000) },
      id: `local-${Date.now()}`
    };

    // Always trigger local listeners for immediate feedback in same-session scenarios
    this.transitListeners.forEach(l => l([confirmation, ...(this.transitListeners[0] as any || [])]));

    try {
      await addDoc(collection(db, 'transit_confirmations'), {
        ...confirmation,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.warn('Transit confirmation logged locally only (Firebase likely not configured)');
    }
  }

  async broadcastAlert(message: string, severity: 'warning' | 'critical') {
    const id = `alert-${Date.now()}`;
    const alert: Alert = {
      id,
      message,
      severity,
      timestamp: Date.now(),
      zoneId: 'global'
    };
    await setDoc(doc(db, 'alerts', id), alert);
  }

  async resetSimulation() {
    // Reset all zone counts to a baseline (e.g. 10%)
    const zonesSnap = await getDocs(collection(db, 'zones'));
    const batch: Promise<any>[] = [];
    zonesSnap.forEach(zDoc => {
      const data = zDoc.data();
      batch.push(setDoc(zDoc.ref, { 
        ...data, 
        currentCount: Math.floor(data.capacity * 0.1) 
      }));
    });
    await Promise.all(batch);
  }

  async recallAllStaff() {
    // Move all staff to a central zone (e.g. HQ)
    // For this simulation, we'll just move them to 'zone-main-concourse'
    const hqZoneId = 'zone-main-concourse';
    const staffSnap = await getDocs(collection(db, 'staff'));
    const batch: Promise<any>[] = [];
    staffSnap.forEach(sDoc => {
      batch.push(setDoc(sDoc.ref, { 
        ...sDoc.data(), 
        zoneId: hqZoneId,
        status: 'on-break'
      }));
    });
    await Promise.all(batch);
  }

  async reinforceStaff() {
    // Set all staff to 'active'
    const staffSnap = await getDocs(collection(db, 'staff'));
    const batch: Promise<any>[] = [];
    staffSnap.forEach(sDoc => {
      batch.push(setDoc(sDoc.ref, { 
        ...sDoc.data(), 
        status: 'active'
      }));
    });
    await Promise.all(batch);
  }

  async getAIAnalysis() {
    const res = await fetch('/api/analyze-crowd', { method: 'POST' });
    return res.json();
  }
}

export const firebaseStadiumService = new FirebaseStadiumService();
