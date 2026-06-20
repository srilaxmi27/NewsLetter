// API base URL
export const API_BASE = 'http://localhost:5000/api';

// Submission types with labels and metadata fields
export const SUBMISSION_TYPES = {
  PLACEMENT: {
    label: 'Placement',
    section: 'Placements',
    fields: [
      { key: 'company', label: 'Company Name', required: true },
      { key: 'role', label: 'Job Role', required: true },
      { key: 'package', label: 'Package (LPA)', required: false },
      { key: 'location', label: 'Location', required: false },
    ],
  },
  RESEARCH: {
    label: 'Research Publication',
    section: 'Research Publications',
    fields: [
      { key: 'journal', label: 'Journal / Conference', required: true },
      { key: 'paper_title', label: 'Paper Title', required: true },
      { key: 'doi', label: 'DOI / Link', required: false },
    ],
  },
  SPORTS: {
    label: 'Sports Achievement',
    section: 'Student Achievements',
    fields: [
      { key: 'sport', label: 'Sport', required: true },
      { key: 'event', label: 'Event / Tournament', required: true },
      { key: 'position', label: 'Position / Medal', required: false },
    ],
  },
  CERTIFICATION: {
    label: 'Certification',
    section: 'Student Achievements',
    fields: [
      { key: 'platform', label: 'Platform (e.g. AWS, Coursera)', required: true },
      { key: 'cert_name', label: 'Certificate Name', required: true },
    ],
  },
  WORKSHOP: {
    label: 'Workshop',
    section: 'Department Activities',
    fields: [
      { key: 'topic', label: 'Workshop Topic', required: true },
      { key: 'organizer', label: 'Organizer', required: false },
      { key: 'date', label: 'Date', required: false },
    ],
  },
  GUEST_LECTURE: {
    label: 'Guest Lecture',
    section: 'Guest Lectures',
    fields: [
      { key: 'speaker', label: 'Speaker Name', required: true },
      { key: 'organization', label: 'Organization', required: false },
      { key: 'topic', label: 'Topic', required: true },
    ],
  },
  FACULTY_ACHIEVEMENT: {
    label: 'Faculty Achievement',
    section: 'Faculty Achievements',
    fields: [
      { key: 'achievement_type', label: 'Achievement Type', required: true },
      { key: 'details', label: 'Details', required: false },
    ],
  },
  STUDENT_ACHIEVEMENT: {
    label: 'Student Achievement',
    section: 'Student Achievements',
    fields: [
      { key: 'achievement_type', label: 'Achievement Type', required: true },
      { key: 'details', label: 'Details', required: false },
    ],
  },
};

// Status badge class helper
export const STATUS_CLASSES = {
  Draft:     'badge-draft',
  Pending:   'badge-pending',
  Approved:  'badge-approved',
  Rejected:  'badge-rejected',
  Selected:  'badge-selected',
  Published: 'badge-published',
  Archived:  'badge-archived',
};

// Months for newsletter creation
export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
