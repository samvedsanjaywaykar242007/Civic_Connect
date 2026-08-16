/**
 * CivicConnect Data Engine & Security Boundary Verification Test Suite
 *
 * Validates:
 * 1. Dual-mode data engine & mock isolation (isMock: true)
 * 2. 5-Stage Complaint Lifecycle transitions & validation
 * 3. Role protection (Citizens cannot transition status)
 * 4. Resolution evidence enforcement (Mandatory after-photo & work report)
 * 5. Citizen rating & feedback submission
 * 6. Community upvotes logic
 */

import { mockDataService } from '../services/mockDataService';
import { complaintService } from '../services/complaintService';
import { UserProfile, ResolutionEvidence } from '../types';

export async function runDataEngineTests(): Promise<{
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
    // Reset mock storage for clean test run
    mockDataService.resetToDefaults();

    // -------------------------------------------------------------------------
    // Test 1: Mock Data Initialization & Isolation
    // -------------------------------------------------------------------------
    const initialComplaints = await mockDataService.getComplaints();
    const allHaveMockFlag = initialComplaints.every((c) => c.isMock === true);
    assert(
      'Mock Data Isolation',
      initialComplaints.length >= 6 && allHaveMockFlag,
      `Loaded ${initialComplaints.length} mock complaints, all stamped with isMock: true.`
    );

    // -------------------------------------------------------------------------
    // Test 2: Citizen Issue Registration & Ticket Generation
    // -------------------------------------------------------------------------
    const citizenUser: UserProfile = {
      uid: 'test_citizen_user',
      email: 'test.citizen@example.com',
      fullName: 'Test Citizen',
      phoneNumber: '+91 98765 43210',
      role: 'citizen',
      ward: 'Ward 1',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newComplaint = await complaintService.createComplaint({
      citizenId: citizenUser.uid,
      citizenName: citizenUser.fullName,
      citizenPhone: citizenUser.phoneNumber,
      title: 'Monsoon waterlogging on Station Road',
      description: 'Water standing 1 foot deep near the bus stop after afternoon heavy rainfall.',
      category: 'Flood',
      priority: 'High',
      status: 'Submitted',
      evidenceImages: [
        {
          id: 'ev_test_1',
          url: 'https://example.com/flood.jpg',
          caption: 'Flooded road surface',
          uploadedAt: new Date().toISOString(),
        },
      ],
      location: {
        latitude: 18.5204,
        longitude: 73.8567,
        address: 'Station Road, Near Bus Stand',
        landmark: 'Near Bus Stand',
        villageOrArea: 'Central Station',
        ward: 'Ward 1',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
      },
    });

    const isTicketValid = newComplaint.ticketNumber.startsWith('CC-2026-MH-');
    assert(
      'Complaint Creation & Ticket Number',
      newComplaint.status === 'Submitted' && isTicketValid,
      `Complaint created with status '${newComplaint.status}' and ticket '${newComplaint.ticketNumber}'.`
    );

    // -------------------------------------------------------------------------
    // Test 3: Role-Based Protection (Citizens cannot transition status)
    // -------------------------------------------------------------------------
    let citizenTransitionBlocked = false;
    try {
      await complaintService.transitionStatus(
        newComplaint.id,
        'Verified',
        citizenUser, // Citizen attempting admin action
        'Citizen trying to verify own ticket'
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Unauthorized')) {
        citizenTransitionBlocked = true;
      }
    }
    assert(
      'Role Protection Security Guard',
      citizenTransitionBlocked,
      'Citizen was successfully blocked from unauthorized status modification.'
    );

    // -------------------------------------------------------------------------
    // Test 4: Lifecycle Transition Sequencing
    // -------------------------------------------------------------------------
    const adminUser: UserProfile = {
      uid: 'admin_test_officer',
      email: 'admin@civicconnect.gov.in',
      fullName: 'Control Desk Officer',
      phoneNumber: '+91 94200 00001',
      role: 'admin',
      ward: 'HQ',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 4A: Step 1 -> Step 2 (Submitted -> Verified)
    const verified = await complaintService.transitionStatus(
      newComplaint.id,
      'Verified',
      adminUser,
      'Complaint verified by control desk officer.'
    );
    assert(
      'Lifecycle Step 1 → 2 (Submitted → Verified)',
      verified.status === 'Verified',
      'Complaint transitioned to Verified.'
    );

    // 4B: Step 2 -> Step 3 (Verified -> Assigned)
    const assigned = await complaintService.transitionStatus(
      newComplaint.id,
      'Assigned',
      adminUser,
      'Assigned to Drainage Division.',
      {
        departmentId: 'drainage',
        departmentName: 'Stormwater Drainage & Flood Control',
        assignedOfficerId: 'officer_drainage_test',
        assignedOfficerName: 'Er. Manoj Pandey',
      }
    );
    assert(
      'Lifecycle Step 2 → 3 (Verified → Assigned)',
      assigned.status === 'Assigned' && assigned.departmentId === 'drainage',
      `Assigned to department '${assigned.departmentName}'.`
    );

    // 4C: Step 3 -> Step 4 (Assigned -> In Progress)
    const inProgress = await complaintService.transitionStatus(
      newComplaint.id,
      'In Progress',
      adminUser,
      'Suction team dispatched to clear drain blockages.'
    );
    assert(
      'Lifecycle Step 3 → 4 (Assigned → In Progress)',
      inProgress.status === 'In Progress',
      'Complaint transitioned to In Progress.'
    );

    // -------------------------------------------------------------------------
    // Test 5: Resolution Proof Requirement (Must fail if no proof provided)
    // -------------------------------------------------------------------------
    let missingEvidenceBlocked = false;
    try {
      await complaintService.transitionStatus(
        newComplaint.id,
        'Resolved',
        adminUser,
        'Trying to resolve without after photos'
        // Missing resolutionEvidence
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Resolution failed')) {
        missingEvidenceBlocked = true;
      }
    }
    assert(
      'Resolution Evidence Enforcement',
      missingEvidenceBlocked,
      'System strictly blocked resolution attempt lacking work report and after-repair photo.'
    );

    // -------------------------------------------------------------------------
    // Test 6: Complete Resolution with Valid Evidence
    // -------------------------------------------------------------------------
    const validResolution: ResolutionEvidence = {
      resolvedAt: new Date().toISOString(),
      resolvedByUid: adminUser.uid,
      resolvedByName: adminUser.fullName,
      resolvedByRole: 'admin',
      departmentId: 'drainage',
      departmentName: 'Stormwater Drainage & Flood Control',
      resolutionDescription: 'Deployed municipal suction jetting truck. Cleared 250kg of plastic debris and silt from culvert. Water receded completely.',
      evidenceImages: [
        {
          id: 'ev_after_test_1',
          url: 'https://example.com/resolved-dry-road.jpg',
          caption: 'After: Completely cleared storm drain and dry carriageway',
          uploadedAt: new Date().toISOString(),
        },
      ],
    };

    const resolved = await complaintService.transitionStatus(
      newComplaint.id,
      'Resolved',
      adminUser,
      'Drainage cleared and dry road verified.',
      { resolutionEvidence: validResolution }
    );
    assert(
      'Lifecycle Step 4 → 5 (In Progress → Resolved with Evidence)',
      resolved.status === 'Resolved' && Boolean(resolved.resolutionDetails?.evidenceImages.length),
      'Complaint successfully resolved with official before/after proof.'
    );

    // -------------------------------------------------------------------------
    // Test 7: Citizen Verification Rating & Feedback
    // -------------------------------------------------------------------------
    const rated = await complaintService.submitCitizenFeedback(
      newComplaint.id,
      5,
      'Quick action! Road cleared before evening commute.'
    );
    assert(
      'Citizen Resolution Rating & Verification',
      rated.resolutionDetails?.citizenRating === 5,
      'Citizen 5-star rating and satisfaction feedback recorded.'
    );

    // -------------------------------------------------------------------------
    // Test 8: Timeline Audit Trail Integrity
    // -------------------------------------------------------------------------
    const updates = await complaintService.getComplaintUpdates(newComplaint.id);
    assert(
      'Timeline Audit Trail Integrity',
      updates.length === 5, // Submitted, Verified, Assigned, In Progress, Resolved
      `Audit trail recorded all ${updates.length} lifecycle events with timestamps.`
    );

    // -------------------------------------------------------------------------
    // Test 9: Community Upvote & Anti-Duplication Logic
    // -------------------------------------------------------------------------
    const upvoted1 = await complaintService.upvoteComplaint(newComplaint.id, 'another_citizen_1');
    const countAfterFirst = upvoted1.upvotesCount;
    const upvoted2 = await complaintService.upvoteComplaint(newComplaint.id, 'another_citizen_1'); // Toggle off
    const countAfterToggle = upvoted2.upvotesCount;
    assert(
      'Community Upvote & Toggle Logic',
      countAfterFirst === countAfterToggle + 1,
      `Upvote incremented to ${countAfterFirst} and toggled back to ${countAfterToggle}.`
    );

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    assert('Test Suite Execution', false, `Unexpected error: ${errorMsg}`);
  }

  const allPassed = results.every((r) => r.passed);
  return { passed: allPassed, results };
}

// Auto-run if executed directly
if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
  runDataEngineTests().then((res) => {
    console.log('\n======================================================');
    console.log('  CIVICCONNECT DATA ENGINE & LIFECYCLE TEST RESULTS   ');
    console.log('======================================================');
    res.results.forEach((r, idx) => {
      console.log(`[${idx + 1}] ${r.passed ? '✓' : '✗'} ${r.testName}: ${r.message}`);
    });
    console.log('======================================================');
    console.log(`Summary: ${res.passed ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}\n`);
    if (!res.passed) {
      process.exit(1);
    }
  }).catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
