import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Landmark, UserPlus, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { isValidIndianPhoneNumber, isValidEmail, isValidPincode } from '../../utils/validation';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signupCitizen, error, clearError } = useAuth();
  const { success } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ward, setWard] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!isValidEmail(email)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (!isValidIndianPhoneNumber(phoneNumber)) {
      setValidationError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (pincode && !isValidPincode(pincode)) {
      setValidationError('Please enter a valid 6-digit Indian postal PIN code.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser = await signupCitizen({
        fullName,
        email,
        phoneNumber,
        ward,
        village: village || undefined,
        district,
        state,
        pincode,
        password,
      });

      success('Registration Successful!', `Citizen account created for ${newUser.fullName}`);
      navigate('/citizen/dashboard', { replace: true });
    } catch {
      // AuthContext handles error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '580px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="brand-emblem" style={{ width: '3rem', height: '3rem', margin: '0 auto 0.75rem auto' }}>
            <Landmark size={24} color="#f59e0b" />
          </div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Citizen Registration
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Create your citizen profile to report and track local civic issues
          </p>
        </div>

        {/* Institutional Governance Notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'hsl(214, 100%, 97%)',
            border: '1px solid hsl(214, 95%, 88%)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-primary-800)',
          }}
        >
          <ShieldAlert size={16} color="var(--color-primary-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Citizen Account Lock:</strong> All public registrations are strictly assigned the <code>citizen</code> role. Government officers and municipal administrators must be provisioned through official administrative channels.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Ramesh Patil"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              label="Mobile Number"
              type="tel"
              placeholder="+91 98220 12345"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              helperText="For SMS status updates"
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="ramesh.patil@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Gram Panchayat / Ward"
              type="text"
              placeholder="e.g. Ward 4 / Gram Panchayat"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              required
            />

            <Input
              label="Village / Local Area"
              type="text"
              placeholder="e.g. Khed Village (Optional)"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="District"
              type="text"
              placeholder="Pune"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              required
            />

            <Input
              label="State"
              type="text"
              placeholder="Maharashtra"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />

            <Input
              label="PIN Code"
              type="text"
              placeholder="410501"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              required
            />
          </div>

          <Input
            label="Create Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {(validationError || error) && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--color-danger-50)',
                color: 'var(--color-danger-700)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                marginBottom: '1rem',
              }}
              role="alert"
            >
              {validationError || error}
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting} leftIcon={<UserPlus size={16} />}>
            Create Citizen Account
          </Button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary-700)', fontWeight: 600 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
