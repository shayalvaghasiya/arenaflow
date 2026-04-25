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
  getDoc
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
  private currentState: Partial<StadiumState> = {};

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
  }

  private triggerUpdate() {
    if (this.currentState.zones && this.currentState.staff) {
      this.stateListeners.forEach(l => l(this.currentState as StadiumState));
    }
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

  async getAIAnalysis() {
    const res = await fetch('/api/analyze-crowd', { method: 'POST' });
    return res.json();
  }
}

export const firebaseStadiumService = new FirebaseStadiumService();
