import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Search } from 'lucide-react';
import { noticeService } from '../../services/noticeService';
import { GovernmentNotice } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardBody } from '../../components/common/Card';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';

export const CitizenNoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<GovernmentNotice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadNotices() {
      try {
        const data = await noticeService.getNotices();
        setNotices(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadNotices();
  }, []);

  const filteredNotices = notices.filter((n) => {
    if (selectedPriority !== 'all' && n.priority !== selectedPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.departmentName.toLowerCase().includes(q) ||
        n.targetArea.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }} className="animate-fade-in">
      <PageHeader
        title="Public Municipal &amp; Gram Panchayat Advisories"
        subtitle="Official notices, disaster alerts, and scheduled infrastructure maintenance schedules"
      />

      {/* Filter and Search Bar */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardBody style={{ padding: '0.875rem 1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search advisories or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[
                { key: 'all', label: 'All Notices' },
                { key: 'Urgent', label: 'Urgent Alerts' },
                { key: 'Important', label: 'Important' },
                { key: 'General', label: 'General' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedPriority(tab.key)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: selectedPriority === tab.key ? 700 : 500,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: selectedPriority === tab.key ? 'var(--color-primary-600)' : 'var(--border-subtle)',
                    backgroundColor: selectedPriority === tab.key ? 'var(--color-primary-50)' : 'transparent',
                    color: selectedPriority === tab.key ? 'var(--color-primary-900)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Notices List */}
      {isLoading ? (
        <LoadingState message="Loading government advisories..." />
      ) : filteredNotices.length === 0 ? (
        <EmptyState
          title="No advisories found"
          description="There are no active municipal notices matching your search criteria."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredNotices.map((n) => {
            const isUrgent = n.priority === 'Urgent';
            return (
              <Card
                key={n.id}
                style={{
                  borderLeft: `5px solid ${isUrgent ? 'var(--color-danger-600)' : 'var(--color-primary-800)'}`,
                }}
              >
                <CardBody style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 700,
                          color: 'var(--color-primary-800)',
                          backgroundColor: 'var(--color-primary-50)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {n.departmentName}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 700,
                          color: isUrgent ? 'var(--color-danger-700)' : 'var(--color-primary-700)',
                          backgroundColor: isUrgent ? 'var(--color-danger-50)' : 'var(--color-gray-100)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {n.priority}
                      </span>
                    </div>

                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={13} /> {formatDate(n.createdAt)}
                    </div>
                  </div>

                  <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {n.title}
                  </h3>

                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
                    {n.content}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={13} /> <strong>Target Jurisdiction:</strong> {n.targetArea}
                    </span>
                    <span>
                      🏛️ <strong>Issued By:</strong> {n.issuedBy}
                    </span>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
