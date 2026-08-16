import React, { useState } from 'react';
import { Globe, Bell, Eye, Save, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Input';

export const CitizenSettingsPage: React.FC = () => {
  const { logout } = useAuth();
  const { success } = useToast();

  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [emergencyBroadcasts, setEmergencyBroadcasts] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      success('Preferences Saved', 'Your language, notification, and accessibility preferences have been updated.');
    }, 500);
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }} className="animate-fade-in">
      <PageHeader
        title="Citizen Portal Settings &amp; Preferences"
        subtitle="Manage communication channels, language, and accessibility preferences"
      />

      <form onSubmit={handleSaveSettings}>
        {/* Language Selection */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <CardHeader>
            <h3 style={{ fontSize: 'var(--font-size-base)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={18} color="var(--color-primary-700)" /> Preferred Regional Language
            </h3>
          </CardHeader>
          <CardBody>
            <Select
              label="Interface &amp; SMS Communication Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'mr')}
              options={[
                { value: 'en', label: 'English (Default)' },
                { value: 'hi', label: 'हिंदी (Hindi)' },
                { value: 'mr', label: 'मराठी (Marathi)' },
              ]}
              helperText="Status notifications and public notices will be delivered in your chosen language."
            />
          </CardBody>
        </Card>

        {/* Notifications Preference */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <CardHeader>
            <h3 style={{ fontSize: 'var(--font-size-base)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={18} color="var(--color-primary-700)" /> Grievance Notification Channels
            </h3>
          </CardHeader>
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>SMS Status Notifications</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Receive SMS updates whenever an officer inspects or resolves your complaint.
                </div>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-primary-800)' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Email Audit Reports</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Receive before/after work verification photo proofs via email.
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-primary-800)' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Emergency Disaster Alerts</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  High-priority broadcast warnings for flood, road collapse, or heavy storm alerts.
                </div>
              </div>
              <input
                type="checkbox"
                checked={emergencyBroadcasts}
                onChange={(e) => setEmergencyBroadcasts(e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-primary-800)' }}
              />
            </label>
          </CardBody>
        </Card>

        {/* Accessibility & Display */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <CardHeader>
            <h3 style={{ fontSize: 'var(--font-size-base)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={18} color="var(--color-primary-700)" /> Accessibility &amp; Display
            </h3>
          </CardHeader>
          <CardBody>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>High-Contrast Text Mode</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Enhance legibility in bright sunlight or low-contrast mobile screens.
                </div>
              </div>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--color-primary-800)' }}
              />
            </label>
          </CardBody>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Button type="button" variant="outline" onClick={() => logout()} leftIcon={<LogOut size={16} />}>
            Sign Out of Account
          </Button>

          <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save size={16} />}>
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};
