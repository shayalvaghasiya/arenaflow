import { firebaseStadiumService } from './firebaseService';
import { StadiumState, Alert } from '../types';

// Bridging the existing interface to the new Firebase implementation
export const stadiumService = {
  onStateUpdate: (callback: (state: StadiumState) => void) => firebaseStadiumService.onStateUpdate(callback),
  onAlertsUpdate: (callback: (alerts: Alert[]) => void) => firebaseStadiumService.onAlertsUpdate(callback),
  dispatchInstruction: (staffId: string, message: string) => firebaseStadiumService.dispatchInstruction(staffId, message),
  acknowledgeInstruction: (id: string) => {
    // We need both IDs for subcollection access in standard Firebase logic, 
    // but the current UI only passes the instruction ID.
    // For now, we assume S-1 (the main test staff) or look it up.
    firebaseStadiumService.acknowledgeInstruction('S-1', id);
  },
  setEventStatus: (status: StadiumState['eventStatus']) => firebaseStadiumService.setEventStatus(status),
  resolveIncident: (incidentId: string) => firebaseStadiumService.resolveIncident(incidentId),
  replaceZoneCount: (zoneId: string, count: number) => firebaseStadiumService.replaceZoneCount(zoneId, count),
  deployStaff: (staffId: string, zoneId: string) => firebaseStadiumService.deployStaff(staffId, zoneId),
  reportIncident: (staffId: string, zoneId: string, type: 'medical' | 'security' | 'fire' | 'crowd') => 
    firebaseStadiumService.reportIncident(staffId, zoneId, type),
  getInitialState: async (): Promise<StadiumState> => {
    const res = await fetch('/api/state');
    return res.json();
  },
  getAIAnalysis: () => firebaseStadiumService.getAIAnalysis()
};
