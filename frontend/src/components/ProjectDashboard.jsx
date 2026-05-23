import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GanttChart from './GanttChart';
import { fetchProject } from '../api';

const RISK_COLOR = {
  High: { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c' },
  Medium: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' },
  Low: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
};

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function SectionPanel({ title, content, icon }) {
  if (!content) return null;
  return (
    <div className="section-panel">
      <div className="section-panel-header">
        <span className="section-panel-icon">{icon}</span>
        <h3>{title}</h3>
      </div>
      <p>{content}</p>
    </div>
  );
}

function RiskMatrix({ risks }) {
  if (!risks?.length) return null;
  return (
    <div className="charter-block">
      <h2>Risk Assessment</h2>
      <div className="risk-grid">
        {risks.map((r, i) => {
          const color = RISK_COLOR[r.likelihood] || RISK_COLOR.Medium;
          return (
            <div key={i} className="risk-card" style={{ borderColor: color.border, background: color.bg }}>
              <div className="risk-card-header">
                <strong>{r.title}</strong>
                <div className="risk-badges">
                  <span className="risk-badge" style={{ color: color.text, borderColor: color.border }}>
                    {r.likelihood} likelihood
                  </span>
                  <span className="risk-badge" style={{ color: color.text, borderColor: color.border }}>
                    {r.impact} impact
                  </span>
                </div>
              </div>
              <p>{r.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KPISection({ kpis }) {
  if (!kpis?.length) return null;
  return (
    <div className="charter-block">
      <h2>Key Performance Indicators</h2>
      <div className="kpi-list">
        {kpis.map((kpi, i) => (
          <div key={i} className="kpi-pill">
            <span className="kpi-index">{i + 1}</span>
            {kpi}
          </div>
        ))}
      </div>
    </div>
  );
}

function totalDuration(phases) {
  const valid = phases.filter((p) => p.startDate && p.endDate);
  if (!valid.length) return null;
  const starts = valid.map((p) => new Date(p.startDate));
  const ends = valid.map((p) => new Date(p.endDate));
  const min = new Date(Math.min(...starts));
  const max = new Date(Math.max(...ends));
  const days = Math.round((max - min) / 86400000);
  return days > 0 ? days : null;
}

export default function ProjectDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchProject(id);
        setProject(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="loading">Loading project...</div>;
  if (error)
    return (
      <div className="error-state">
        <h2>Error</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );

  const { enhanced, phases = [], resources = [] } = project;
  const duration = totalDuration(phases);
  const kpis = enhanced?.kpis || [];

  return (
    <div>
      {/* Toolbar — hidden when printing */}
      <div className="dashboard-toolbar no-print">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>← Back</button>
        <button className="btn btn-export" onClick={() => window.print()}>Export as PDF</button>
      </div>

      {/* Charter document — this is what prints */}
      <div className="dashboard" id="charter-export">

        {/* Header */}
        <div className="charter-header">
          <div className="charter-badge">Project Charter</div>
          <h1>{project.name}</h1>
          {(enhanced?.executiveSummary || project.description) && (
            <p className="executive-summary">
              {enhanced?.executiveSummary || project.description}
            </p>
          )}
          <div className="charter-meta">
            <span>{new Date(project.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {phases.length > 0 && <span>{phases.length} phase{phases.length !== 1 ? 's' : ''}</span>}
            {resources.length > 0 && <span>{resources.length} team member{resources.length !== 1 ? 's' : ''}</span>}
          </div>
        </div>

        {/* Stats bar */}
        {(duration || phases.length || resources.length || kpis.length) ? (
          <div className="stats-bar">
            {duration && <StatCard label="Total Duration" value={`${duration} days`} />}
            {phases.length > 0 && <StatCard label="Phases" value={phases.length} />}
            {resources.length > 0 && <StatCard label="Team Size" value={resources.length} />}
            {kpis.length > 0 && <StatCard label="KPIs Defined" value={kpis.length} />}
          </div>
        ) : null}

        {/* Timeline */}
        {phases.length > 0 && <GanttChart phases={phases} />}

        {/* Charter details grid */}
        <div className="charter-block">
          <h2>Charter Details</h2>
          <div className="sections-grid">
            <SectionPanel title="Objectives" icon="🎯" content={enhanced?.objectives || project.objectives} />
            <SectionPanel title="Scope" icon="📐" content={enhanced?.scope || project.scope} />
            <SectionPanel title="Description" icon="📋" content={enhanced?.description || project.description} />
            {enhanced?.stakeholderNote && (
              <SectionPanel title="Stakeholders" icon="👥" content={enhanced.stakeholderNote} />
            )}
          </div>
        </div>

        {/* Risks */}
        {enhanced?.risks?.length > 0
          ? <RiskMatrix risks={enhanced.risks} />
          : project.risks && (
            <div className="charter-block">
              <h2>Risks</h2>
              <div className="sections-grid">
                <SectionPanel title="Identified Risks" icon="⚠️" content={project.risks} />
              </div>
            </div>
          )}

        {/* KPIs */}
        <KPISection kpis={kpis} />

        {/* Team */}
        {resources.length > 0 && (
          <div className="charter-block">
            <h2>Team Resources</h2>
            <div className="resources-grid">
              {resources.map((r, i) => (
                <div key={i} className="resource-card">
                  <div className="resource-avatar">{r.name?.charAt(0)?.toUpperCase() || '?'}</div>
                  <div>
                    <strong>{r.name}</strong>
                    <p>{r.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
