/**
 * Phase 4: Citizen Portal Verification & Data Flow Test Suite
 *
 * Validates:
 * 1. Citizen grievance creation via multi-step wizard data payload
 * 2. Gemini AI smart classification engine (offline/online)
 * 3. Grievance lookup and live tracking with 5-stage timeline
 * 4. Community upvoting mechanics
 * 5. Resolution verification & Citizen 1-5 Star Satisfaction rating
 * 6. Public notice retrieval and citizen notification hub
 */

import { complaintService } from '../services/complaintService';
import { geminiService } from '../services/geminiService';
import { notificationService } from '../services/notificationService';
import { noticeService } from '../services/noticeService';
import { mockDataService } from '../services/mockDataService';
import { UserProfile, ResolutionEvidence } from '../types';

export async function runCitizenPortalTests(): Promise<{
  passed: boolean;
  results: Array<{ testName: string; passed: boolean; message: string }>;
}> {
  const results: Array<{ testName: string; passed: boolean; message: string }> = [];

  const assert = (testName: string, condition: boolean, message: string) => {
    results.push({
      testName,
      passed: condition,
      message: condition ? `PASSED: ${message}` : `FAILED: ${message}`,
    });
  };

  try {
    mockDataService.resetToDefaults();

    // -------------------------------------------------------------------------
    // Test 1: Gemini AI Smart Classification Engine
    // -------------------------------------------------------------------------
    const aiResult = await geminiService.classifyComplaint(
      'Deep asphalt crater pothole on high speed state highway causing severe skidding and accidents.',
      'State Highway 27, Khed'
    );

    assert(
      'Gemini AI Category & Priority Classification',
      aiResult.category === 'Pothole' && (aiResult.priority === 'High' || aiResult.priority === 'Critical'),
      `AI accurately classified as '${aiResult.category}' with '${aiResult.priority}' priority. Rationale: ${aiResult.rationale}`
    );

    // -------------------------------------------------------------------------
    // Test 2: Multi-Step Issue Reporting Wizard Submission
    // -------------------------------------------------------------------------
    const created = await complaintService.createComplaint({
      citizenId: 'user_cit_01',
      citizenName: 'Ramesh Patil',
      citizenPhone: '+91 98220 12345',
      title: 'Large crater pothole on market access road',
      description: 'Dangerous pothole approximately 2 feet wide right in front of the primary school.',
      category: 'Pothole',
      priority: 'High',
      status: 'Submitted',
      evidenceImages: [
        {
          id: 'ev_p4_1',
          url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
          uploadedAt: new Date().toISOString(),
        },
      ],
      location: {
        latitude: 18.7521,
        longitude: 73.8654,
        address: 'Zilla Parishad Primary School Road, Khed',
        landmark: 'Opposite Sub-Centre',
        villageOrArea: 'Khed Village',
        ward: 'Ward 4',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '410501',
      },
    });

    assert(
      'Grievance Creation & Unique Ticket ID',
      Boolean(created.id && created.ticketNumber.startsWith('CC-2026-MH-')),
      `Created complaint with Ticket ID: '${created.ticketNumber}', status: '${created.status}'.`
    );

    // -------------------------------------------------------------------------
    // Test 3: Live Grievance Tracking by Ticket Code
    // -------------------------------------------------------------------------
    const found = await complaintService.getComplaintById(created.ticketNumber);
    const updates = await complaintService.getComplaintUpdates(created.id);
    assert(
      'Live Ticket Code Lookup & Audit Trail',
      Boolean(found && found.id === created.id && updates.length >= 1),
      `Successfully retrieved ticket '${created.ticketNumber}' with ${updates.length} audit updates.`
    );

    // -------------------------------------------------------------------------
    // Test 4: Community Upvoting Mechanics
    // -------------------------------------------------------------------------
    const initialUpvotes = created.upvotesCount;
    const upvoted = await complaintService.upvoteComplaint(created.id, 'user_cit_02');
    assert(
      'Community Upvote Increment',
      upvoted.upvotesCount === initialUpvotes + 1,
      `Upvote count successfully increased to ${upvoted.upvotesCount}.`
    );

    // -------------------------------------------------------------------------
    // Test 5: Resolution Verification & Citizen 5-Star Rating
    // -------------------------------------------------------------------------
    const adminActor: UserProfile = {
      uid: 'admin_01',
      fullName: 'Dr. Aditi Kulkarni (IAS)',
      email: 'admin@civicconnect.gov.in',
      phoneNumber: '+91 94220 11000',
      role: 'admin',
      ward: 'Headquarters',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const officerActor: UserProfile = {
      uid: 'pwd_01',
      fullName: 'Er. Vikram Joshi',
      email: 'pwd.officer@civicconnect.gov.in',
      phoneNumber: '+91 94220 22001',
      role: 'officer',
      departmentId: 'pwd',
      departmentName: 'Public Works Department (Roads & Bridges)',
      ward: 'Sub-Division North',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '410501',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Transition lifecycle step-by-step
    await complaintService.transitionStatus(created.id, 'Verified', adminActor, 'Verified by Municipal Control Desk');
    await complaintService.transitionStatus(created.id, 'Assigned', adminActor, 'Assigned to PWD Roads', {
      departmentId: 'pwd',
      departmentName: 'Public Works Department (Roads & Bridges)',
      assignedOfficerId: 'pwd_01',
      assignedOfficerName: 'Er. Vikram Joshi',
    });
    await complaintService.transitionStatus(created.id, 'In Progress', officerActor, 'Field crew deployed on site');

    const resolutionEvidence: ResolutionEvidence = {
      resolvedAt: new Date().toISOString(),
      resolvedByUid: 'pwd_01',
      resolvedByName: 'Er. Vikram Joshi',
      resolvedByRole: 'officer',
      departmentId: 'pwd',
      departmentName: 'Public Works Department (Roads & Bridges)',
      resolutionDescription: 'Excavated damaged road segment, laid compacted WBM sub-base, and hot-mix bitumen rolled.',
      evidenceImages: [
        {
          id: 'ev_res_01',
          url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800',
          caption: 'Repaired and resurfaced asphalt',
          uploadedAt: new Date().toISOString(),
        },
      ],
    };

    await complaintService.transitionStatus(created.id, 'Resolved', officerActor, 'Pothole repaired cleanly', {
      resolutionEvidence,
    });

    // Citizen rates the resolution
    const ratedComplaint = await complaintService.rateResolution(
      created.id,
      5,
      'Excellent repair work, the road is completely smooth now.'
    );

    assert(
      'Citizen Satisfaction Rating & Feedback',
      ratedComplaint.resolutionDetails?.citizenRating === 5 &&
        Boolean(ratedComplaint.resolutionDetails?.citizenFeedback),
      `Recorded ${ratedComplaint.resolutionDetails?.citizenRating}-Star citizen verification: "${ratedComplaint.resolutionDetails?.citizenFeedback}".`
    );

    // -------------------------------------------------------------------------
    // Test 6: Public Notices & Notifications Engine
    // -------------------------------------------------------------------------
    const notices = await noticeService.getNotices();
    const notifications = await notificationService.getNotifications('user_cit_01');

    assert(
      'Public Notices & Citizen Notification Delivery',
      notices.length > 0 && notifications.length > 0,
      `Retrieved ${notices.length} public advisories and ${notifications.length} real-time notifications.`
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    assert('Citizen Portal Test Execution', false, `Unexpected error: ${msg}`);
  }

  const allPassed = results.every((r) => r.passed);
  return { passed: allPassed, results };
}

// Auto-run if executed directly via Node/tsx
if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
  runCitizenPortalTests().then((res) => {
    console.log('\n======================================================');
    console.log('      CIVICCONNECT CITIZEN PORTAL TEST RESULTS        ');
    console.log('======================================================');
    res.results.forEach((r, idx) => {
      console.log(`[${idx + 1}] ${r.passed ? '✓' : '✗'} ${r.testName}: ${r.message}`);
    });
    console.log('======================================================');
    console.log(`Summary: ${res.passed ? 'ALL CITIZEN PORTAL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}\n`);
    if (!res.passed) {
      process.exit(1);
    }
  }).catch((err) => {
    console.error('Citizen test execution failed:', err);
    process.exit(1);
  });
}
