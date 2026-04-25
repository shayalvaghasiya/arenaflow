import { firebaseStadiumService } from './firebaseService';
import { StadiumState, Alert } from '../types';

// Bridging the existing interface to the new Firebase implementation
export const stadiumService = {
  // Listeners
  onStateUpdate: (callback: (state: StadiumState) => void) => firebaseStadiumService.onStateUpdate(callback),
  onAlertsUpdate: (callback: (alerts: Alert[]) => void) => firebaseStadiumService.onAlertsUpdate(callback),
  onTransitUpdate: (callback: (transits: any[]) => void) => firebaseStadiumService.onTransitUpdate(callback),

  // Actions
  dispatchInstruction: (staffId: string, message: string) => firebaseStadiumService.dispatchInstruction(staffId, message),
  acknowledgeInstruction: (id: string, staffId: string = 'S-1') => firebaseStadiumService.acknowledgeInstruction(staffId, id),
  setEventStatus: (status: StadiumState['eventStatus']) => firebaseStadiumService.setEventStatus(status),
  resolveIncident: (incidentId: string) => firebaseStadiumService.resolveIncident(incidentId),
  replaceZoneCount: (zoneId: string, count: number) => firebaseStadiumService.replaceZoneCount(zoneId, count),
  deployStaff: (staffId: string, zoneId: string) => firebaseStadiumService.deployStaff(staffId, zoneId),
  reportIncident: (staffId: string, zoneId: string, type: 'medical' | 'security' | 'fire' | 'crowd') => 
    firebaseStadiumService.reportIncident(staffId, zoneId, type),
  confirmTransit: (gateId: string, gateName: string) => firebaseStadiumService.confirmTransit(gateId, gateName),
  broadcastAlert: (message: string, severity: 'warning' | 'critical') => firebaseStadiumService.broadcastAlert(message, severity),
  resetSimulation: () => firebaseStadiumService.resetSimulation(),
  recallAllStaff: () => firebaseStadiumService.recallAllStaff(),
  reinforceStaff: () => firebaseStadiumService.reinforceStaff(),
  
  // AI
  getAIAnalysis: () => firebaseStadiumService.getAIAnalysis(),
};
