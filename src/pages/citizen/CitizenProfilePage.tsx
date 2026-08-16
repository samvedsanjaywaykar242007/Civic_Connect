import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody, CardHeader, CardFooter } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const CitizenProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || 'Ramesh Patil');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '+91 98220 12345');
  const [email] = useState(user?.email || 'ramesh.patil@example.com');
  const [ward, setWard] = useState(user?.ward || 'Ward 4 - Gram Panchayat');
  const [village, setVillage] = useState(user?.village || 'Khed Village');
  const [district, setDistrict] = useState(user?.district || 'Pune');
  const [state, setState] = useState(user?.state || 'Maharashtra');
  const [pincode, setPincode] = useState(user?.pincode || '410501');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      success('Profile Updated', 'Your contact details and ward jurisdiction have been updated.');
    }, 600);
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }} className="animate-fade-in">
      <PageHeader
        title="Citizen Profile &amp; Ward Identity"
        subtitle="Manage your personal information, mobile alerts, and jurisdictional ward registration"
      />

      <form onSubmit={handleSaveProfile}>
        <Card style={{ marginBottom: '1.5rem' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                className="user-avatar"
                style={{ width: '4rem', height: '4rem', fontSize: '1.5rem' }}
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={fullName} />
                ) : (
                  fullName.charAt(0)
                )}
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.25rem' }}>{fullName}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="badge badge-category">Verified Citizen</span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    UID: {user?.uid || 'user_cit_01'}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardBody style={{ padding: '1.5rem 2rem' }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', marginBottom: '1rem', color: 'var(--color-primary-900)' }}>
              1. Personal &amp; Contact Information
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Mobile Number (SMS Updates)"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            <Input
              label="Email Address (Login ID)"
              type="email"
              value={email}
              disabled
              helperText="Email address is linked to your civic credentials and cannot be changed here."
            />

            <h4 style={{ fontSize: 'var(--font-size-sm)', margin: '1.5rem 0 1rem 0', color: 'var(--color-primary-900)' }}>
              2. Jurisdictional Ward &amp; Village Location
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Gram Panchayat / Ward"
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                required
              />

              <Input
                label="Village / Neighborhood"
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="District"
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
              />

              <Input
                label="State"
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />

              <Input
                label="PIN Code"
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                required
              />
            </div>
          </CardBody>

          <CardFooter style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save size={16} />}>
              Save Profile Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};
