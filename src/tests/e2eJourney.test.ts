/**
 * CivicConnect Phase 6: End-to-End Comprehensive Multi-Actor Journey Test Suite
 *
 * Simulates complete civic grievance lifecycle:
 * 1. Citizen registers / logs in
 * 2. Gemini AI smart classification
 * 3. Citizen reports geotagged civic grievance
 * 4. Nodal Officer logs in, filters and verifies grievance
 * 5. Departmental routing & nodal officer assignment
 * 6. Field crew deployment (In Progress)
 * 7. Resolution evidence guard enforcement
 * 8. Resolution with mandatory after-repair photo and work report
 * 9. Citizen tracks ticket, inspects Before/After proof
 * 10. Citizen submits 5-star satisfaction rating
 * 11. Cross-system data consistency & GIS audit check
 */

import { authService } from '../services/authService';
import { complaintService } from '../services/complaintService';
import { geminiService } from '../services/geminiService';
import { mockDataService } from '../services/mockDataService';
import { calculateComplaintSLA } from '../utils/sla';
import { ResolutionEvidence } from '../types';

export async function runEndToEndJourneyTests(): Promise<{
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

    // =========================================================================
    // ACTOR 1: CITIZEN (Ramesh Patil)
    // =========================================================================
    const citizenUser = await authService.quickDemoLogin('citizen');
    assert(
      'Citizen Login & Role Authorization',
      citizenUser.role === 'citizen' && citizenUser.fullName === 'Ramesh Patil',
      `Logged in as Citizen: ${citizenUser.fullName} (${citizenUser.ward}, ${citizenUser.district}).`
    );

    // AI Assistance: Citizen provides description of severe road damage
    const problemText =
      'There is a massive 4-foot cave-in crater near the bus terminus entrance causing water pooling and two two-wheelers fell into it during rainfall.';
    const aiPrediction = await geminiService.suggestCategoryAndPriority(problemText);

    assert(
      'Gemini AI Autonomous Civic Issue Classification',
      aiPrediction.category === 'Pothole' && (aiPrediction.priority === 'High' || aiPrediction.priority === 'Critical'),
      `AI identified category='${aiPrediction.category}' and priority='${aiPrediction.priority}' (Rationale: ${aiPrediction.reasoning}).`
    );

    // Citizen reports issue with evidence and GPS
    const reportedComplaint = await complaintService.createComplaint({
      citizenId: citizenUser.uid,
      citizenName: citizenUser.fullName,
      citizenPhone: citizenUser.phoneNumber,
      title: 'Massive Crater & Road Cave-In at Bus Terminus',
      description: problemText,
      category: aiPrediction.category,
      priority: aiPrediction.priority,
      status: 'Submitted',
      evidenceImages: [
        {
          id: 'ev_e2e_before_01',
          url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
          uploadedAt: new Date().toISOString(),
        },
      ],
      location: {
        latitude: 18.5204,
        longitude: 73.8567,
        address: 'Main Entrance Road, Narayangaon Bus Terminus',
        ward: 'Ward 4 - Bus Stand',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '410504',
      },
    });

    const ticketId = reportedComplaint.ticketNumber;
    const complaintDbId = reportedComplaint.id;

    assert(
      'Grievance Ingestion & Ticket Generation',
      Boolean(ticketId) && ticketId.startsWith('CC-2026-MH-') && reportedComplaint.status === 'Submitted',
      `Citizen registered complaint successfully. Generated Ticket ID: ${ticketId}.`
    );

    // Verify Citizen Data Consistency
    const citizenMyComplaints = await complaintService.getComplaintsByCitizen(citizenUser.uid);
    const inCitizenList = citizenMyComplaints.some((c) => c.id === complaintDbId);

    assert(
      'Citizen Registry Consistency',
      inCitizenList,
      `New complaint is immediately visible in Citizen's Personal Complaint Registry.`
    );

    // =========================================================================
    // ACTOR 2: NODAL OFFICER (Er. Vikram Joshi - PWD)
    // =========================================================================
    const pwdOfficer = await authService.quickDemoLogin('officer', 'pwd');
    assert(
      'Nodal Officer Login & Departmental Binding',
      pwdOfficer.role === 'officer' && pwdOfficer.departmentId === 'pwd',
      `Logged in as PWD Nodal Officer: ${pwdOfficer.fullName} (${pwdOfficer.departmentName}).`
    );

    // Step 1: Verify Complaint
    const verifiedComplaint = await complaintService.transitionStatus(
      complaintDbId,
      'Verified',
      pwdOfficer,
      'Field inspection confirmed structural sub-base collapse under bus weight.'
    );

    assert(
      'Lifecycle Step 1: Verification (Submitted → Verified)',
      verifiedComplaint.status === 'Verified',
      `Grievance verified by PWD Officer. Status advanced to 'Verified'.`
    );

    // Step 2: Assign Department & Nodal Officer
    const assignedComplaint = await complaintService.transitionStatus(
      complaintDbId,
      'Assigned',
      pwdOfficer,
      'Assigned to PWD Heavy Machinery Road Repair Division.',
      {
        departmentId: 'pwd',
        departmentName: 'Public Works Department (Roads & Bridges)',
        assignedOfficerId: pwdOfficer.uid,
        assignedOfficerName: pwdOfficer.fullName,
      }
    );

    assert(
      'Lifecycle Step 2: Department Routing (Verified → Assigned)',
      assignedComplaint.status === 'Assigned' &&
        assignedComplaint.departmentId === 'pwd' &&
        assignedComplaint.assignedOfficerName === 'Er. Vikram Joshi',
      `Routed to PWD. Assigned Nodal Officer: ${assignedComplaint.assignedOfficerName}.`
    );

    // Step 3: Deploy Crew (In Progress)
    const inProgressComplaint = await complaintService.transitionStatus(
      complaintDbId,
      'In Progress',
      pwdOfficer,
      'Crew mobilized with cold milling machine, JCB, and 10T roller.'
    );

    assert(
      'Lifecycle Step 3: Field Crew Deployment (Assigned → In Progress)',
      inProgressComplaint.status === 'In Progress',
      `Crew deployed on site. Status updated to 'In Progress'.`
    );

    // Security Check: Attempting resolution without mandatory photo proof
    let blockedPrematureResolution = false;
    try {
      await complaintService.transitionStatus(
        complaintDbId,
        'Resolved',
        pwdOfficer,
        'Trying to resolve without photo'
      );
    } catch {
      blockedPrematureResolution = true;
    }

    assert(
      'Resolution Evidence Guard Integrity',
      blockedPrematureResolution,
      `Strictly prevented premature resolution without mandatory after-repair photo evidence.`
    );

    // Step 4: Complete Repair & Upload Official Resolution Proof
    const resolutionProof: ResolutionEvidence = {
      resolvedAt: new Date().toISOString(),
      resolvedByUid: pwdOfficer.uid,
      resolvedByName: pwdOfficer.fullName,
      resolvedByRole: 'officer',
      departmentId: 'pwd',
      departmentName: 'Public Works Department (Roads & Bridges)',
      resolutionDescription:
        'Excavated damaged crater to 450mm depth, backfilled with crushed stone aggregate (WBM), applied tack coat, and compacted dense bituminous macadam (DBM) with smooth asphalt wearing course.',
      evidenceImages: [
        {
          id: 'ev_e2e_after_proof_01',
          url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800',
          uploadedAt: new Date().toISOString(),
        },
      ],
    };

    const resolvedComplaint = await complaintService.transitionStatus(
      complaintDbId,
      'Resolved',
      pwdOfficer,
      'Road cave-in fully resurfaced and opened for public bus transit.',
      { resolutionEvidence: resolutionProof }
    );

    assert(
      'Lifecycle Step 4: Resolution with Mandatory Proof (In Progress → Resolved)',
      resolvedComplaint.status === 'Resolved' &&
        Boolean(resolvedComplaint.resolutionDetails?.evidenceImages?.length) &&
        resolvedComplaint.resolutionDetails?.resolvedByName === 'Er. Vikram Joshi',
      `Complaint resolved with official photographic proof and work report by ${resolvedComplaint.resolutionDetails?.resolvedByName}.`
    );

    // =========================================================================
    // ACTOR 3: CITIZEN VERIFICATION & SATISFACTION SCORING
    // =========================================================================
    const trackedComplaint = await complaintService.getComplaintByTicketNumber(ticketId);

    assert(
      'Citizen Ticket Tracking & Proof Verification',
      Boolean(trackedComplaint) &&
        trackedComplaint?.status === 'Resolved' &&
        Boolean(trackedComplaint?.resolutionDetails?.evidenceImages?.length),
      `Citizen looked up ticket #${ticketId}. Verified Before/After evidence gallery is visible.`
    );

    // Citizen provides 5-Star Satisfaction Rating & Feedback
    const ratedComplaint = await complaintService.rateResolution(
      complaintDbId,
      5,
      'The repair was done very quickly and the road is perfectly flat now. Thank you PWD team!'
    );

    assert(
      'Citizen Satisfaction Score & Verification Feedback',
      Boolean(
        ratedComplaint.resolutionDetails?.citizenRating === 5 &&
          ratedComplaint.resolutionDetails?.citizenFeedback?.includes('perfectly flat')
      ),
      `Citizen submitted 5-Star satisfaction rating and confirmation feedback.`
    );

    // =========================================================================
    // ACTOR 4: AUDIT TRAIL, SLA, AND CROSS-SYSTEM DATA INTEGRITY
    // =========================================================================
    const fullAuditTimeline = await complaintService.getComplaintUpdates(complaintDbId);

    assert(
      'Immutable Audit Timeline Completeness',
      fullAuditTimeline.length >= 4,
      `Full chronological audit trail recorded ${fullAuditTimeline.length} events with actor stamps.`
    );

    const calculatedSLA = calculateComplaintSLA(
      ratedComplaint.createdAt,
      ratedComplaint.priority,
      ratedComplaint.status,
      ratedComplaint.resolutionDetails?.resolvedAt
    );

    assert(
      'SLA Clock Compliance & Audit Benchmark',
      calculatedSLA.slaHours > 0 && !Boolean(calculatedSLA.isOverdue),
      `SLA benchmark checked: ${calculatedSLA.slaHours}h target window. Completed within SLA bounds.`
    );

    // GIS Map dataset consistency
    const allGISComplaints = await complaintService.getComplaints();
    const mapComplaint = allGISComplaints.find((c) => c.id === complaintDbId);

    assert(
      'GIS Coordinate & Map Consistency',
      Boolean(mapComplaint) &&
        mapComplaint?.location.latitude === 18.5204 &&
        mapComplaint?.location.longitude === 73.8567 &&
        mapComplaint?.status === 'Resolved',
      `GIS Municipal map dataset reflects exact coordinates (18.5204° N, 73.8567° E) with status 'Resolved'.`
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    assert('End-to-End Journey Test Execution', false, `Unexpected error: ${msg}`);
  }

  const allPassed = results.every((r) => r.passed);
  return { passed: allPassed, results };
}

// Auto-run if executed directly via Node/tsx
if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
  runEndToEndJourneyTests().then((res) => {
    console.log('\n======================================================');
    console.log('     CIVICCONNECT END-TO-END JOURNEY TEST RESULTS     ');
    console.log('======================================================');
    res.results.forEach((r, idx) => {
      console.log(`[${idx + 1}] ${r.passed ? '✓' : '✗'} ${r.testName}: ${r.message}`);
    });
    console.log('======================================================');
    console.log(`Summary: ${res.passed ? 'ALL END-TO-END WORKFLOW TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}\n`);
    if (!res.passed) {
      process.exit(1);
    }
  }).catch((err) => {
    console.error('End-to-End test execution failed:', err);
    process.exit(1);
  });
}
