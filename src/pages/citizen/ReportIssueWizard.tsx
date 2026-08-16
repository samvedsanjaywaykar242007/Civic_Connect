import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  FileCheck,
  Check,
  LocateFixed,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { complaintService } from '../../services/complaintService';
import { locationService } from '../../services/locationService';
import { geminiService } from '../../services/geminiService';
import { ComplaintCategory, PriorityLevel, LocationData } from '../../types';
import { ISSUE_CATEGORIES, PRIORITY_LEVELS } from '../../utils/constants';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody, CardFooter } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Textarea, Select } from '../../components/common/Input';
import { CategoryBadge, PriorityBadge } from '../../components/common/Badge';
import { CivicMap } from '../../components/map/CivicMap';
import { Modal } from '../../components/common/Modal';

// Sample presentation images
const SAMPLE_EVIDENCE = {
  pothole: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
  water_leakage: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=800&auto=format&fit=crop&q=80',
  garbage: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80',
  broken_street_light: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
  drainage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
};

export const ReportIssueWizard: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();
  const navigate = useNavigate();

  // Wizard Step State (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Category
  const [category, setCategory] = useState<ComplaintCategory>('Pothole');

  // Step 2: Details & AI
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    category: ComplaintCategory;
    priority: PriorityLevel;
    rationale: string;
    suggestedTitle?: string;
  } | null>(null);

  // Step 3: Evidence Images
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);

  // Step 4: Location
  const [locationData, setLocationData] = useState<LocationData>({
    latitude: 18.7512,
    longitude: 73.8643,
    address: 'Near Old Gram Panchayat Bhavan, Main Market Road',
    ward: user?.ward || 'Ward 4 - Gram Panchayat',
    village: user?.village || 'Khed Village',
    district: user?.district || 'Pune',
    state: user?.state || 'Maharashtra',
    pincode: user?.pincode || '410501',
    landmark: 'Opposite Village Primary Health Sub-Centre',
  });
  const [isDetectingGPS, setIsDetectingGPS] = useState<boolean>(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // Step 2: Gemini AI Analysis Trigger
  // ---------------------------------------------------------------------------
  const handleAnalyzeWithAI = async () => {
    if (!description.trim() && !title.trim()) {
      toastError('Please enter a brief description first so Gemini AI can analyze the problem.');
      return;
    }

    setIsAnalyzingAI(true);
    try {
      const result = await geminiService.classifyComplaint(
        `${title ? title + '. ' : ''}${description}`,
        locationData.address
      );

      setAiSuggestion({
        category: result.category,
        priority: result.priority,
        rationale: result.rationale,
      });

      info(
        'Gemini AI Analysis Complete',
        `Suggested: ${result.category.toUpperCase()} (${result.priority} Priority). Click Apply to update.`
      );
    } catch {
      toastError('AI assistant encountered an issue. You can continue manually.');
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleApplyAISuggestion = () => {
    if (aiSuggestion) {
      setCategory(aiSuggestion.category);
      setPriority(aiSuggestion.priority);
      if (!title.trim()) {
        setTitle(`Severe ${aiSuggestion.category.replace('_', ' ')} issue at ${locationData.ward}`);
      }
      setAiSuggestion(null);
      success('AI Suggestion Applied!', 'Category and priority have been updated.');
    }
  };

  // ---------------------------------------------------------------------------
  // Step 3: Evidence Handling
  // ---------------------------------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const result = uploadEvent.target?.result as string;
          if (result) {
            setEvidenceImages((prev) => [...prev, result]);
          }
        };
        reader.readAsDataURL(file);
      });
      success('Photo attached', `${files.length} evidence photo(s) added.`);
    } catch {
      toastError('Failed to read photo file.');
    }
  };

  const handleLoadSamplePhoto = (sampleKey: keyof typeof SAMPLE_EVIDENCE) => {
    const url = SAMPLE_EVIDENCE[sampleKey];
    if (url && !evidenceImages.includes(url)) {
      setEvidenceImages((prev) => [...prev, url]);
      info('Sample Photo Loaded', 'Ready for demonstration submission.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setEvidenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ---------------------------------------------------------------------------
  // Step 4: GPS Geolocation
  // ---------------------------------------------------------------------------
  const handleDetectGPS = async () => {
    setIsDetectingGPS(true);
    try {
      const coords = await locationService.getCurrentPosition();
      const geocoded = await locationService.reverseGeocode(coords.latitude, coords.longitude);

      setLocationData((prev) => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: geocoded.address,
        ward: geocoded.ward || prev.ward,
        district: geocoded.district || prev.district,
        state: geocoded.state || prev.state,
        pincode: geocoded.pincode || prev.pincode,
      }));

      success(
        'GPS Geotag Acquired',
        `Coordinates: ${coords.latitude.toFixed(4)}° N, ${coords.longitude.toFixed(4)}° E (High Accuracy)`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'GPS detection failed';
      toastError('Location Error', `${msg}. You can adjust the location manually on the map.`);
    } finally {
      setIsDetectingGPS(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Step 5: Final Submission
  // ---------------------------------------------------------------------------
  const handleSubmitGrievance = async () => {
    if (!title.trim() || !description.trim()) {
      toastError('Validation Error', 'Please complete title and description.');
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const photos = evidenceImages.length > 0 ? evidenceImages : [SAMPLE_EVIDENCE.pothole];
      const newComplaint = await complaintService.createComplaint({
        citizenId: user?.uid || 'anon_citizen',
        citizenName: user?.fullName || 'Anonymous Citizen',
        citizenPhone: user?.phoneNumber || '+91 98220 00000',
        title,
        description,
        category,
        priority,
        status: 'Submitted',
        evidenceImages: photos.map((url, idx) => ({
          id: `ev_${Date.now()}_${idx}`,
          url,
          uploadedAt: new Date().toISOString(),
        })),
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address,
          ward: locationData.ward,
          villageOrArea: locationData.village || locationData.villageOrArea || 'Khed',
          district: locationData.district,
          state: locationData.state,
          pincode: locationData.pincode,
          landmark: locationData.landmark || '',
        },
      });

      setCreatedTicketNumber(newComplaint.ticketNumber);
      setShowSuccessModal(true);
      success('Grievance Registered Successfully!', `Ticket: ${newComplaint.ticketNumber}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      toastError('Submission Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }} className="animate-fade-in">
      <PageHeader
        title="Report a Civic Grievance"
        subtitle="Submit problems directly to your Gram Panchayat or Municipal Department with GPS &amp; photo proof"
        breadcrumbs={[
          { label: 'Citizen Portal', href: '/citizen/dashboard' },
          { label: 'New Grievance Report' },
        ]}
      />

      {/* Progress Steps Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          backgroundColor: 'var(--bg-surface)',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {[
          { step: 1, label: 'Category' },
          { step: 2, label: 'Details & AI' },
          { step: 3, label: 'Evidence' },
          { step: 4, label: 'Location' },
          { step: 5, label: 'Review & Submit' },
        ].map((s, idx) => (
          <React.Fragment key={s.step}>
            {idx > 0 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: currentStep >= s.step ? 'var(--color-primary-600)' : 'var(--border-subtle)',
                  margin: '0 0.5rem',
                  transition: 'background-color var(--transition-normal)',
                }}
              />
            )}
            <button
              type="button"
              onClick={() => setCurrentStep(s.step)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
            >
              <div
                style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  borderRadius: '50%',
                  backgroundColor:
                    currentStep === s.step
                      ? 'var(--color-primary-900)'
                      : currentStep > s.step
                      ? 'var(--color-success-600)'
                      : 'var(--color-gray-200)',
                  color: currentStep >= s.step ? '#ffffff' : 'var(--text-muted)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {currentStep > s.step ? '✓' : s.step}
              </div>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: currentStep === s.step ? 700 : 500,
                  color: currentStep === s.step ? 'var(--color-primary-900)' : 'var(--text-secondary)',
                  display: 'none',
                }}
                className="d-md-inline"
              >
                {s.label}
              </span>
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* =====================================================================
          STEP 1: ISSUE CATEGORY
          ===================================================================== */}
      {currentStep === 1 && (
        <Card className="animate-scale-in">
          <CardBody style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '0.5rem' }}>
              Step 1: Select Grievance Category
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Choose the category that best describes the municipal or rural infrastructure problem.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {ISSUE_CATEGORIES.map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <div
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-lg)',
                      border: `2px solid ${isSelected ? 'var(--color-primary-600)' : 'var(--border-subtle)'}`,
                      backgroundColor: isSelected ? 'var(--color-primary-50)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {cat.label}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {cat.description}
                      </div>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.6875rem', color: 'var(--color-primary-700)', fontWeight: 600 }}>
                        Department: {cat.defaultDepartmentCode}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 size={20} color="var(--color-primary-600)" style={{ flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          </CardBody>

          <CardFooter style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="primary"
              onClick={() => setCurrentStep(2)}
              rightIcon={<ArrowRight size={16} />}
            >
              Continue to Details
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* =====================================================================
          STEP 2: ISSUE DETAILS & GEMINI AI
          ===================================================================== */}
      {currentStep === 2 && (
        <Card className="animate-scale-in">
          <CardBody style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-size-xl)' }}>Step 2: Grievance Details</h3>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                  Describe the problem clearly so the assigned officer can dispatch the right crew.
                </p>
              </div>
              <CategoryBadge category={category} />
            </div>

            <Input
              label="Complaint Title / Headline"
              type="text"
              placeholder="e.g. Deep pothole causing two-wheeler accidents near market"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <Textarea
                label="Detailed Description"
                placeholder="Explain what is broken, approximate dimensions, how long it has been present, and immediate public safety risks..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />

              {/* Gemini AI Assistant Button */}
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isAnalyzingAI}
                  leftIcon={<Sparkles size={14} color="var(--color-accent-600)" />}
                  onClick={handleAnalyzeWithAI}
                  style={{ borderColor: 'var(--color-accent-400)', backgroundColor: 'hsl(45, 100%, 97%)' }}
                >
                  Analyze with Gemini AI
                </Button>
              </div>
            </div>

            {/* AI Suggestion Box */}
            {aiSuggestion && (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'hsl(215, 100%, 97%)',
                  border: '1px solid hsl(215, 95%, 85%)',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-800)', marginBottom: '0.25rem' }}>
                    <Sparkles size={15} color="var(--color-primary-600)" />
                    Gemini AI Recommendation:
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {aiSuggestion.rationale}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>Suggested:</span>
                    <CategoryBadge category={aiSuggestion.category} />
                    <PriorityBadge priority={aiSuggestion.priority} />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleApplyAISuggestion}
                  leftIcon={<Check size={14} />}
                >
                  Apply
                </Button>
              </div>
            )}

            <Select
              label="Urgency / Severity Level"
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityLevel)}
              options={PRIORITY_LEVELS.map((p) => ({ value: p.level, label: `${p.label} — ${p.description}` }))}
              helperText="High and Critical issues alert emergency nodal officers immediately."
            />
          </CardBody>

          <CardFooter style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outline" onClick={() => setCurrentStep(1)} leftIcon={<ArrowLeft size={16} />}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!title.trim() || !description.trim()) {
                  toastError('Please fill in title and description.');
                  return;
                }
                setCurrentStep(3);
              }}
              rightIcon={<ArrowRight size={16} />}
            >
              Continue to Evidence
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* =====================================================================
          STEP 3: PHOTOGRAPHIC EVIDENCE
          ===================================================================== */}
      {currentStep === 3 && (
        <Card className="animate-scale-in">
          <CardBody style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '0.5rem' }}>
              Step 3: Photographic Evidence
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Upload clear photos showing the problem and surrounding landmarks.
            </p>

            {/* Upload Dropzone */}
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2.5rem',
                border: '2px dashed var(--border-default)',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--bg-surface-subtle)',
                cursor: 'pointer',
                marginBottom: '1.5rem',
                textAlign: 'center',
                transition: 'all var(--transition-fast)',
              }}
            >
              <UploadCloud size={40} color="var(--color-primary-600)" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                Click to browse or drag photos here
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                PNG, JPG, JPEG up to 10MB each
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>

            {/* Presentation 1-Click Sample Evidence Presets */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Quick Presentation Demo Photos (1-Click Load)
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button type="button" variant="outline" size="sm" onClick={() => handleLoadSamplePhoto('pothole')}>
                  + Pothole Photo
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleLoadSamplePhoto('water_leakage')}>
                  + Water Leak Photo
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleLoadSamplePhoto('garbage')}>
                  + Garbage Photo
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleLoadSamplePhoto('drainage')}>
                  + Drainage Block Photo
                </Button>
              </div>
            </div>

            {/* Attached Photos Gallery */}
            {evidenceImages.length > 0 && (
              <div>
                <h4 style={{ fontSize: 'var(--font-size-sm)', marginBottom: '0.75rem' }}>
                  Attached Evidence ({evidenceImages.length})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  {evidenceImages.map((imgUrl, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        height: '110px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <img
                        src={imgUrl}
                        alt={`Evidence ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        aria-label="Remove photo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>

          <CardFooter style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outline" onClick={() => setCurrentStep(2)} leftIcon={<ArrowLeft size={16} />}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (evidenceImages.length === 0) {
                  // Pre-load default sample so user isn't blocked
                  setEvidenceImages([SAMPLE_EVIDENCE.pothole]);
                }
                setCurrentStep(4);
              }}
              rightIcon={<ArrowRight size={16} />}
            >
              Continue to Location
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* =====================================================================
          STEP 4: LOCATION & GIS GEOTAGGING
          ===================================================================== */}
      {currentStep === 4 && (
        <Card className="animate-scale-in">
          <CardBody style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: 'var(--font-size-xl)' }}>Step 4: Geotag Location</h3>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                  Pin the exact location on the map or detect via mobile GPS.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                isLoading={isDetectingGPS}
                onClick={handleDetectGPS}
                leftIcon={<LocateFixed size={15} />}
              >
                Detect My GPS
              </Button>
            </div>

            {/* Interactive Location Selector Map */}
            <div style={{ marginBottom: '1.5rem' }}>
              <CivicMap
                center={[locationData.latitude, locationData.longitude]}
                zoom={14}
                selectedLocation={locationData}
                interactiveSelection={true}
                onSelectLocation={(coords) => {
                  setLocationData((prev) => ({
                    ...prev,
                    latitude: coords.lat,
                    longitude: coords.lng,
                    address: coords.address || `Near Lat ${coords.lat.toFixed(4)}, Lng ${coords.lng.toFixed(4)}`,
                  }));
                }}
                height="320px"
              />
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.35rem', textAlign: 'right' }}>
                💡 Click or drag pin on map to adjust exact incident coordinates
              </div>
            </div>

            {/* Address fields */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Street Address / Road Name"
                type="text"
                value={locationData.address}
                onChange={(e) => setLocationData({ ...locationData, address: e.target.value })}
                required
              />

              <Input
                label="Gram Panchayat / Ward"
                type="text"
                value={locationData.ward}
                onChange={(e) => setLocationData({ ...locationData, ward: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Village / Local Area"
                type="text"
                value={locationData.village || ''}
                onChange={(e) => setLocationData({ ...locationData, village: e.target.value })}
              />

              <Input
                label="District"
                type="text"
                value={locationData.district}
                onChange={(e) => setLocationData({ ...locationData, district: e.target.value })}
                required
              />

              <Input
                label="Prominent Landmark"
                type="text"
                placeholder="e.g. Near Water Tank"
                value={locationData.landmark || ''}
                onChange={(e) => setLocationData({ ...locationData, landmark: e.target.value })}
              />
            </div>

            {/* GPS Coordinates readout */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span>Latitude: <strong>{locationData.latitude.toFixed(6)}°</strong></span>
              <span>Longitude: <strong>{locationData.longitude.toFixed(6)}°</strong></span>
            </div>
          </CardBody>

          <CardFooter style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outline" onClick={() => setCurrentStep(3)} leftIcon={<ArrowLeft size={16} />}>
              Back
            </Button>
            <Button variant="primary" onClick={() => setCurrentStep(5)} rightIcon={<ArrowRight size={16} />}>
              Review &amp; Submit
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* =====================================================================
          STEP 5: REVIEW & SUBMIT
          ===================================================================== */}
      {currentStep === 5 && (
        <Card className="animate-scale-in">
          <CardBody style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '0.5rem' }}>
              Step 5: Review &amp; Official Submission
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Confirm your grievance report details before generating your tracking ticket.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Summary Card */}
              <div
                style={{
                  padding: '1.25rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <CategoryBadge category={category} />
                    <PriorityBadge priority={priority} />
                  </div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Status: Draft (Pending Submit)</span>
                </div>

                <h4 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  {title}
                </h4>

                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: 'var(--font-size-xs)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  <div>
                    <strong>Location:</strong> {locationData.address}, {locationData.ward}
                  </div>
                  <div>
                    <strong>Jurisdiction:</strong> {locationData.district}, {locationData.state} ({locationData.pincode})
                  </div>
                  <div>
                    <strong>Reporter:</strong> {user?.fullName} ({user?.phoneNumber})
                  </div>
                  <div>
                    <strong>Coordinates:</strong> {locationData.latitude.toFixed(4)}° N, {locationData.longitude.toFixed(4)}° E
                  </div>
                </div>
              </div>

              {/* Photos Preview */}
              {evidenceImages.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 'var(--font-size-sm)', marginBottom: '0.5rem' }}>
                    Attached Photos ({evidenceImages.length})
                  </h4>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {evidenceImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Evidence ${i + 1}`}
                        style={{ width: '90px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardBody>

          <CardFooter style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outline" onClick={() => setCurrentStep(4)} leftIcon={<ArrowLeft size={16} />}>
              Back to Location
            </Button>
            <Button
              variant="secondary"
              size="lg"
              isLoading={isSubmitting}
              onClick={handleSubmitGrievance}
              leftIcon={<FileCheck size={18} />}
            >
              Submit Official Grievance
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Success Modal upon Complaint Generation */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate(`/citizen/track?ticket=${createdTicketNumber}`);
        }}
        title="Grievance Registered Successfully"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/citizen/dashboard');
              }}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowSuccessModal(false);
                navigate(`/citizen/track?ticket=${createdTicketNumber}`);
              }}
            >
              Track Live Status &rarr;
            </Button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              backgroundColor: 'hsl(150, 80%, 93%)',
              color: 'hsl(155, 85%, 26%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '0.5rem' }}>
            Complaint Acknowledged
          </h3>

          <div
            style={{
              display: 'inline-block',
              padding: '0.5rem 1.25rem',
              backgroundColor: 'var(--color-primary-50)',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--color-primary-200)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 800,
              color: 'var(--color-primary-900)',
              marginBottom: '1rem',
            }}
          >
            {createdTicketNumber}
          </div>

          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Your grievance has been safely saved in the CivicConnect database and queued for municipal verification. You can track this ticket anytime using your ticket code.
          </p>
        </div>
      </Modal>
    </div>
  );
};
