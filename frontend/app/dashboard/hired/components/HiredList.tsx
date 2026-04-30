"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { 
  Search, 
  Mail, 
  GraduationCap, 
  Briefcase, 
  FileText,
  CheckCircle2,
} from "lucide-react";
import { applicantsApi, type Applicant } from "@/lib/api";

export function HiredList() {
  const { getToken } = useAuth();
  const [hired, setHired] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (token) {
          // Fetch only applicants with 'hired' status
          const data = await applicantsApi.list(token, "hired");
          setHired(data);
        }
      } catch (err) {
        console.error("Failed to load hired applicants", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken]);

  const filtered = hired.filter(h => 
    `${h.first_name} ${h.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={18} />
          <input
            type="text"
            placeholder="Search hired faculty..."
            className="input"
            style={{ paddingLeft: '40px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Showing {filtered.length} hired personnel
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ height: '200px', background: 'var(--color-bg-elevated)', opacity: 0.5 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
          <CheckCircle2 size={48} style={{ margin: '0 auto 1rem', color: 'var(--color-text-muted)', opacity: 0.3 }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '0.5rem' }}>No hired faculty found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Applicants appear here once they are marked as &apos;hired&apos; after optimization.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filtered.map((app) => (
            <div key={app.id} className="card animate-fadein" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: 'var(--color-accent-subtle)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'var(--color-accent)', 
                  fontWeight: 'bold', 
                  fontSize: '20px' 
                }}>
                  {app.first_name[0]}{app.last_name[0]}
                </div>
                <div className="badge" style={{ background: 'var(--color-success-subtle)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Hired
                </div>
              </div>
              
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '0.25rem' }}>
                {app.first_name} {app.last_name}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                <Mail size={12} /> {app.email}
              </p>

              <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                  <GraduationCap size={14} style={{ color: 'var(--color-accent)' }} />
                  <span style={{ textTransform: 'capitalize' }}>{app.highest_degree.replace('_', ' ')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                  <Briefcase size={14} style={{ color: 'var(--color-accent)' }} />
                  <span>{app.years_experience} years experience</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                  <FileText size={14} style={{ color: 'var(--color-accent)' }} />
                  <span>{app.research_outputs} research outputs</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
