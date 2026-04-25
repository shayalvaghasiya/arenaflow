/**
 * Stadium System Types
 */

export interface Zone {
  id: string;
  name: string;
  type: 'gate' | 'seating' | 'food' | 'restroom' | 'concourse';
  capacity: number;
  currentCount: number;
  x: number;
  y: number;
  neighbors: string[];
}

export interface StaffInstruction {
  id: string;
  staffId: string;
  message: string;
  timestamp: number;
  status: 'pending' | 'acknowledged' | 'completed';
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'security' | 'facility' | 'medical';
  zoneId: string;
  status: 'active' | 'on-break' | 'responding';
}

export interface WaitTime {
  zoneId: string;
  minutes: number;
  status: 'low' | 'medium' | 'high';
}

export interface StadiumState {
  zones: Record<string, Zone>;
  waitTimes: Record<string, WaitTime>;
  staff: StaffMember[];
  instructions: StaffInstruction[];
  eventStatus: 'pre-match' | 'ongoing' | 'halftime' | 'ending' | 'post-match';
  matchMinute: number;
  totalAttendees: number;
  timestamp: number;
}

export interface Alert {
  id: string;
  zoneId: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'incident';
  timestamp: number;
}
