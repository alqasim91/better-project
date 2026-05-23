import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GanttChart from './GanttChart';
import { fetchProject } from '../api';

function Badge({ children, variant = 'default' }) {
  return <span className={`status-badge status-badge--${variant}`}>{children}</span>;
}

function Section({ number, title, children }) {
  return (
    <div className="charter-section">
      <div className="charter-section-heading">
        <span className="charter-section-num">{number}</span>
        <h2>{title}</h2>
      </div>
      <div className="charter-section-body">{children}</div>
    </div>
  );
}

function CharterTable({ headers, rows }) {
  return (
    <table className="charter-table">
      <thead>
        <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>{row.map((cell, j) => <td key={j}>{cell || '—'}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
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
        setProject(await fetchProject(id));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="loading">Generating your project charter...</div>;
  if (error) return (
    <div className="error-state">
      <h2>Error</h2><p>{error}</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );

  const e = project.enhanced || {};
  const phases = project.phases || [];
  const team = project.team || [];
  const risks = e.risks?.length ? e.risks : (project.risks || []);
  const deliverables = e.deliverables?.length ? e.deliverables : (project.deliverables || []);
  const outOfScope = e.outOfScope?.length ? e.outOfScope : (project.outOfScope || []);
  const approvals = project.approvals || [];

  // Build Gantt-compatible phases from the new schema
  const ganttPhases = phases
    .filter(p => p.phase && p.startDate && p.endDate)
    .map(p => ({ name: p.phase, startDate: p.startDate, endDate: p.endDate }));

  return (
    <div className="charter-page">
      {/* Toolbar */}
      <div className="dashboard-toolbar no-print">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>← Back</button>
        <button className="btn btn-export" onClick={() => window.print()}>Export as PDF</button>
      </div>

      {/* Charter document */}
      <div className="charter-doc" id="charter-export">

        {/* AI status — temporary diagnostic, hidden once working */}
        {e._error && (
          <div className="ai-error-banner no-print">
            ⚠️ AI enhancement failed: <code>{e._error}</code>. Showing your raw input.
          </div>
        )}
        {!e._error && e.executiveSummary && (
          <div className="ai-ok-banner no-print">✨ AI enhanced</div>
        )}

        {/* Cover header */}
        <div className="charter-cover">
          <div className="charter-cover-label">Project Charter</div>
          <h1 className="charter-cover-title">{project.name}</h1>
          {e.executiveSummary && (
            <p className="charter-cover-summary">{e.executiveSummary}</p>
          )}
          <table className="charter-meta-table">
            <tbody>
              {project.projectManager && <tr><td>Project Manager</td><td><strong>{project.projectManager}</strong></td></tr>}
              {project.sponsor && <tr><td>Sponsor</td><td><strong>{project.sponsor}</strong></td></tr>}
              {project.startDate && <tr><td>Start Date</td><td>{project.startDate}</td></tr>}
              {project.endDate && <tr><td>Target End Date</td><td>{project.endDate}</td></tr>}
              <tr>
                <td>Status</td>
                <td>
                  <Badge variant={project.status === 'Approved' ? 'approved' : 'draft'}>
                    {project.status || 'Draft'}
                  </Badge>
                </td>
              </tr>
              <tr><td>Created</td><td>{new Date(project.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
            </tbody>
          </table>
        </div>

        <hr className="charter-divider" />

        {/* Section 1 */}
        <Section number="1" title="Why Are We Doing This?">
          <p>{e.purpose || project.purpose || '—'}</p>
        </Section>

        <hr className="charter-divider" />

        {/* Section 2 */}
        <Section number="2" title="What Will We Deliver?">
          {deliverables.filter(Boolean).length > 0 && (
            <ul className="charter-list">
              {deliverables.filter(Boolean).map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
          {outOfScope.filter(Boolean).length > 0 && (
            <div className="charter-out-of-scope">
              <strong>Out of scope:</strong>
              <ul className="charter-list">
                {outOfScope.filter(Boolean).map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          )}
        </Section>

        <hr className="charter-divider" />

        {/* Section 3 */}
        {team.length > 0 && (
          <>
            <Section number="3" title="Team">
              <CharterTable
                headers={['Role', 'Name']}
                rows={team.map(t => [t.role, t.name])}
              />
            </Section>
            <hr className="charter-divider" />
          </>
        )}

        {/* Section 4 */}
        <Section number="4" title="Timeline">
          {ganttPhases.length > 0 && (
            <div className="charter-gantt-wrap">
              <GanttChart phases={ganttPhases} />
            </div>
          )}
          {phases.filter(p => p.phase).length > 0 && (
            <CharterTable
              headers={['Phase', 'Start Date', 'Target Date']}
              rows={phases.filter(p => p.phase).map(p => [p.phase, p.startDate, p.endDate])}
            />
          )}
        </Section>

        <hr className="charter-divider" />

        {/* Section 5 */}
        <Section number="5" title="Budget">
          <p>{e.budgetNote || project.budget || 'TBD pending approval'}</p>
        </Section>

        <hr className="charter-divider" />

        {/* Section 6 */}
        <Section number="6" title="Top Risks">
          {Array.isArray(risks) && risks.length > 0 ? (
            <CharterTable
              headers={['Risk', 'Mitigation']}
              rows={risks.map(r => [r.risk || r, r.mitigation || ''])}
            />
          ) : (
            <p>{typeof risks === 'string' ? risks : '—'}</p>
          )}
        </Section>

        <hr className="charter-divider" />

        {/* Section 7 */}
        <Section number="7" title="Approval">
          {approvals.length > 0 ? (
            <CharterTable
              headers={['Name', 'Role', 'Date']}
              rows={approvals.map(a => [a.name, a.role, a.date])}
            />
          ) : (
            <p className="charter-approval-placeholder">Pending sign-off</p>
          )}
        </Section>

      </div>
    </div>
  );
}
