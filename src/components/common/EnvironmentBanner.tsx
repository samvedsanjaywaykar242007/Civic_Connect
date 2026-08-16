import React, { useState } from 'react';
import { appConfig } from '../../config/env';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export const EnvironmentBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  if (appConfig.isDemoMode) {
    return (
      <aside className="env-banner env-banner-demo" role="region" aria-label="Environment Simulation Notice">
        <AlertCircle size={14} aria-hidden="true" />
        <span>
          <strong>College Field Project Simulation Mode:</strong> Preloaded with 15+ sample civic complaints across Maharashtra & Uttar Pradesh wards. Changes are saved in local session memory.
        </span>
        <button
          onClick={() => setIsDismissed(true)}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex' }}
          aria-label="Dismiss environment notice"
        >
          <X size={14} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="env-banner env-banner-live" role="region" aria-label="Live Cloud Connection Notice">
      <CheckCircle2 size={14} aria-hidden="true" />
      <span>
        <strong>Connected to Live CivicConnect Cloud:</strong> Real-time synchronization active with Firebase & Cloud Firestore.
      </span>
      <button
        onClick={() => setIsDismissed(true)}
        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex' }}
        aria-label="Dismiss environment notice"
      >
        <X size={14} />
      </button>
    </aside>
  );
};
