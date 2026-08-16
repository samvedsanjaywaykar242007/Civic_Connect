import { IssueCategory, IssuePriority, ComplaintStatus } from '../types';

export const ISSUE_CATEGORIES: {
  key: IssueCategory;
  label: string;
  description: string;
  iconName: string;
  defaultDepartmentCode: string;
}[] = [
  {
    key: 'Pothole',
    label: 'Pothole & Damaged Road',
    description: 'Cracked pavement, road craters, and hazardous road surface damage',
    iconName: 'AlertTriangle',
    defaultDepartmentCode: 'PWD',
  },
  {
    key: 'Flood',
    label: 'Flooding & Waterlogging',
    description: 'Submerged roads, monsoon runoff blockages, overflowing streams',
    iconName: 'Waves',
    defaultDepartmentCode: 'DISASTER',
  },
  {
    key: 'Road blockage',
    label: 'Road Obstruction & Debris',
    description: 'Fallen construction debris, illegal encroachments, vehicle blockages',
    iconName: 'Ban',
    defaultDepartmentCode: 'TRAFFIC',
  },
  {
    key: 'Garbage',
    label: 'Garbage & Waste Accumulation',
    description: 'Uncollected refuse, overflowing public dustbins, illegal dumping',
    iconName: 'Trash2',
    defaultDepartmentCode: 'SANITATION',
  },
  {
    key: 'Broken street light',
    label: 'Non-functional Street Light',
    description: 'Dark roadway segments, damaged light poles, blinking fixtures',
    iconName: 'LightbulbOff',
    defaultDepartmentCode: 'ELEC',
  },
  {
    key: 'Water leakage',
    label: 'Drinking Water Pipeline Leak',
    description: 'Burst municipal supply lines, leaking valves, contaminated supply',
    iconName: 'Droplets',
    defaultDepartmentCode: 'WATER',
  },
  {
    key: 'Fallen tree',
    label: 'Fallen Tree or Heavy Branch',
    description: 'Uprooted trees obstructing power lines, roads, or residences',
    iconName: 'Trees',
    defaultDepartmentCode: 'GARDEN',
  },
  {
    key: 'Landslide',
    label: 'Hillside Erosion & Landslide',
    description: 'Mudslides, rock falls on ghats and rural hilly tracks',
    iconName: 'Mountain',
    defaultDepartmentCode: 'DISASTER',
  },
  {
    key: 'Drainage problem',
    label: 'Clogged Drain & Sewer Overflow',
    description: 'Open gutters, blocked culverts, sewage backflow in village streets',
    iconName: 'GitPullRequest',
    defaultDepartmentCode: 'DRAINAGE',
  },
  {
    key: 'Other',
    label: 'Other Civic Infrastructure Problem',
    description: 'Any public grievance not categorized above',
    iconName: 'HelpCircle',
    defaultDepartmentCode: 'ADMIN',
  },
];

export const ISSUE_PRIORITIES: {
  key: IssuePriority;
  label: string;
  color: string;
  badgeClass: string;
  description: string;
}[] = [
  {
    key: 'Low',
    label: 'Low',
    color: '#0D9488',
    badgeClass: 'badge-priority-low',
    description: 'Minor inconvenience, no immediate safety hazard (SLA: 7 days)',
  },
  {
    key: 'Medium',
    label: 'Medium',
    color: '#D97706',
    badgeClass: 'badge-priority-medium',
    description: 'Moderate impact on daily transit or sanitation (SLA: 72 hours)',
  },
  {
    key: 'High',
    label: 'High',
    color: '#EA580C',
    badgeClass: 'badge-priority-high',
    description: 'Severe civic disruption or localized safety concern (SLA: 24 hours)',
  },
  {
    key: 'Critical',
    label: 'Critical / Emergency',
    color: '#DC2626',
    badgeClass: 'badge-priority-critical',
    description: 'Immediate threat to public life, health, or major highway (SLA: 6 hours)',
  },
];

export const PRIORITY_LEVELS = ISSUE_PRIORITIES.map((p) => ({
  level: p.key,
  label: p.label,
  description: p.description,
}));

export const COMPLAINT_STATUSES: {
  key: ComplaintStatus;
  label: string;
  stepNumber: number;
  badgeClass: string;
  description: string;
}[] = [
  {
    key: 'Submitted',
    label: 'Submitted',
    stepNumber: 1,
    badgeClass: 'badge-status-submitted',
    description: 'Complaint registered by citizen with GPS location and photo evidence.',
  },
  {
    key: 'Verified',
    label: 'Verified',
    stepNumber: 2,
    badgeClass: 'badge-status-verified',
    description: 'Municipal desk verified validity and prioritized the issue.',
  },
  {
    key: 'Assigned',
    label: 'Assigned',
    stepNumber: 3,
    badgeClass: 'badge-status-assigned',
    description: 'Assigned to the responsible department and designated nodal officer.',
  },
  {
    key: 'In Progress',
    label: 'In Progress',
    stepNumber: 4,
    badgeClass: 'badge-status-inprogress',
    description: 'Field repair team dispatched and maintenance work is underway on site.',
  },
  {
    key: 'Resolved',
    label: 'Resolved',
    stepNumber: 5,
    badgeClass: 'badge-status-resolved',
    description: 'Work completed with official proof photos and citizen verification enabled.',
  },
];

export const EMERGENCY_HELPLINES = [
  {
    name: 'National Emergency Helpline',
    number: '112',
    icon: 'PhoneCall',
    description: 'All-in-one Police, Fire, Ambulance & Disaster response across India',
  },
  {
    name: 'Police Control Room',
    number: '100',
    icon: 'Shield',
    description: 'Immediate law enforcement and public security assistance',
  },
  {
    name: 'Ambulance & Medical Emergency',
    number: '108 / 102',
    icon: 'HeartPulse',
    description: 'Emergency medical transport and village health services',
  },
  {
    name: 'Fire Department',
    number: '101',
    icon: 'Flame',
    description: 'Fire suppression and heavy rescue operations',
  },
  {
    name: 'Disaster Management Helpline',
    number: '1070 / 1077',
    icon: 'AlertOctagon',
    description: 'Flood, cyclone, landslide & earthquake emergency response',
  },
  {
    name: 'Women & Child Helpline',
    number: '1090 / 1098',
    icon: 'Users',
    description: '24/7 dedicated support and safety helpline',
  },
];
