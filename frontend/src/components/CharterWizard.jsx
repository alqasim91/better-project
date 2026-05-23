import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../api';

const STEPS = [
  { id: 'overview',     title: 'Project Overview',         icon: '📋', desc: 'Basic details and key stakeholders' },
  { id: 'purpose',      title: 'Why Are We Doing This?',   icon: '🎯', desc: 'The problem or goal this project addresses' },
  { id: 'deliverables', title: 'What Will We Deliver?',    icon: '📦', desc: 'Outputs, scope, and boundaries' },
  { id: 'team',         title: 'Team',                     icon: '👥', desc: 'Roles and people involved' },
  { id: 'timeline',     title: 'Timeline',                 icon: '📅', desc: 'Phases and target dates' },
  { id: 'budget',       title: 'Budget',                   icon: '💰', desc: 'Estimated cost' },
  { id: 'risks',        title: 'Top Risks',                icon: '⚠️', desc: 'Risks and how to handle them' },
  { id: 'approval',     title: 'Approval',                 icon: '✅', desc: 'Who signs off on this charter' },
];

const INITIAL = {
  name: '',
  projectManager: '',
  sponsor: '',
  startDate: '',
  endDate: '',
  status: 'Draft',
  purpose: '',
  deliverables: ['', '', ''],
  outOfScope: [''],
  team: [
    { role: 'Project Manager', name: '' },
    { role: 'Tech Lead', name: '' },
    { role: 'Developer(s)', name: '' },
    { role: 'Key Stakeholder', name: '' },
  ],
  phases: [
    { phase: 'Kickoff', startDate: '', endDate: '' },
    { phase: '', startDate: '', endDate: '' },
    { phase: '', startDate: '', endDate: '' },
    { phase: 'Go-Live / Handover', startDate: '', endDate: '' },
  ],
  budget: '',
  risks: [
    { risk: '', mitigation: '' },
    { risk: '', mitigation: '' },
  ],
  approvals: [
    { name: '', role: 'Sponsor', date: '' },
    { name: '', role: 'Project Manager', date: '' },
  ],
};

// ── Step components ──────────────────────────────────────────────────────────

function FG({ label, children, hint }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

function StepOverview({ form, update }) {
  return (
    <div className="step-content">
      <FG label="Project Name *">
        <input
          type="text" required autoFocus
          value={form.name}
          onChange={e => update('name', e.target.value)}
          placeholder="e.g. Customer Portal Redesign"
        />
      </FG>
      <div className="form-row">
        <FG label="Project Manager">
          <input type="text" value={form.projectManager}
            onChange={e => update('projectManager', e.target.value)}
            placeholder="Full name" />
        </FG>
        <FG label="Sponsor">
          <input type="text" value={form.sponsor}
            onChange={e => update('sponsor', e.target.value)}
            placeholder="Full name" />
        </FG>
      </div>
      <div className="form-row">
        <FG label="Start Date">
          <input type="date" value={form.startDate}
            onChange={e => update('startDate', e.target.value)} />
        </FG>
        <FG label="Target End Date">
          <input type="date" value={form.endDate}
            onChange={e => update('endDate', e.target.value)} />
        </FG>
        <FG label="Status">
          <select value={form.status} onChange={e => update('status', e.target.value)}>
            <option>Draft</option>
            <option>Approved</option>
          </select>
        </FG>
      </div>
    </div>
  );
}

function StepPurpose({ form, update }) {
  return (
    <div className="step-content">
      <FG
        label="What problem does this solve — or what goal does it achieve?"
        hint="One or two sentences is enough. AI will polish it."
      >
        <textarea
          rows={6} autoFocus
          value={form.purpose}
          onChange={e => update('purpose', e.target.value)}
          placeholder="e.g. Our customer support team is handling 40% of tickets manually due to an outdated portal. This project will modernise the interface to reduce manual effort and improve customer satisfaction."
        />
      </FG>
    </div>
  );
}

function StepDeliverables({ form, updateList, addListItem, removeListItem }) {
  return (
    <div className="step-content">
      <div className="step-subsection">
        <h3>In Scope — What we will deliver</h3>
        <p className="step-hint">List the 3–5 main things this project will produce or implement.</p>
        {form.deliverables.map((d, i) => (
          <div key={i} className="list-input-row">
            <input
              type="text"
              value={d}
              onChange={e => updateList('deliverables', i, e.target.value)}
              placeholder={`Deliverable ${i + 1}`}
              autoFocus={i === 0}
            />
            {form.deliverables.length > 1 && (
              <button type="button" className="btn-icon-remove" onClick={() => removeListItem('deliverables', i)}>✕</button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addListItem('deliverables', '')}>
          + Add deliverable
        </button>
      </div>

      <div className="step-subsection">
        <h3>Out of Scope — What we are NOT doing</h3>
        <p className="step-hint">Prevents misunderstandings later.</p>
        {form.outOfScope.map((o, i) => (
          <div key={i} className="list-input-row">
            <input
              type="text"
              value={o}
              onChange={e => updateList('outOfScope', i, e.target.value)}
              placeholder={`Out of scope item ${i + 1}`}
            />
            {form.outOfScope.length > 1 && (
              <button type="button" className="btn-icon-remove" onClick={() => removeListItem('outOfScope', i)}>✕</button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addListItem('outOfScope', '')}>
          + Add item
        </button>
      </div>
    </div>
  );
}

function StepTeam({ form, updateObj, addListItem, removeListItem }) {
  return (
    <div className="step-content">
      <p className="step-hint">Add everyone who has a role in this project.</p>
      <div className="table-input">
        <div className="table-input-header">
          <span>Role</span>
          <span>Name</span>
          <span />
        </div>
        {form.team.map((t, i) => (
          <div key={i} className="table-input-row">
            <input
              type="text" value={t.role}
              onChange={e => updateObj('team', i, 'role', e.target.value)}
              placeholder="Role" />
            <input
              type="text" value={t.name}
              onChange={e => updateObj('team', i, 'name', e.target.value)}
              placeholder="Full name"
              autoFocus={i === 0} />
            {form.team.length > 1 && (
              <button type="button" className="btn-icon-remove" onClick={() => removeListItem('team', i)}>✕</button>
            )}
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => addListItem('team', { role: '', name: '' })}>
        + Add team member
      </button>
    </div>
  );
}

function StepTimeline({ form, updateObj, addListItem, removeListItem }) {
  return (
    <div className="step-content">
      <p className="step-hint">Add each project phase. Start and end dates power the visual timeline.</p>
      <div className="table-input">
        <div className="table-input-header timeline-header">
          <span>Phase</span>
          <span>Start Date</span>
          <span>End / Target Date</span>
          <span />
        </div>
        {form.phases.map((p, i) => (
          <div key={i} className="table-input-row timeline-row">
            <input
              type="text" value={p.phase}
              onChange={e => updateObj('phases', i, 'phase', e.target.value)}
              placeholder="Phase name" />
            <input
              type="date" value={p.startDate}
              onChange={e => updateObj('phases', i, 'startDate', e.target.value)} />
            <input
              type="date" value={p.endDate}
              onChange={e => updateObj('phases', i, 'endDate', e.target.value)} />
            {form.phases.length > 1 && (
              <button type="button" className="btn-icon-remove" onClick={() => removeListItem('phases', i)}>✕</button>
            )}
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => addListItem('phases', { phase: '', startDate: '', endDate: '' })}>
        + Add phase
      </button>
    </div>
  );
}

function StepBudget({ form, update }) {
  return (
    <div className="step-content">
      <FG
        label="Estimated Budget"
        hint="e.g. $120,000 — or 'TBD pending approval'"
      >
        <input
          type="text" autoFocus
          value={form.budget}
          onChange={e => update('budget', e.target.value)}
          placeholder="$0 or TBD"
        />
      </FG>
    </div>
  );
}

function StepRisks({ form, updateObj, addListItem, removeListItem }) {
  return (
    <div className="step-content">
      <p className="step-hint">Identify risks and how you plan to handle them. Rough notes are fine — AI will refine them.</p>
      <div className="table-input">
        <div className="table-input-header risks-header">
          <span>Risk</span>
          <span>Mitigation</span>
          <span />
        </div>
        {form.risks.map((r, i) => (
          <div key={i} className="table-input-row risks-row">
            <input
              type="text" value={r.risk}
              onChange={e => updateObj('risks', i, 'risk', e.target.value)}
              placeholder="e.g. Key developer leaves the team"
              autoFocus={i === 0} />
            <input
              type="text" value={r.mitigation}
              onChange={e => updateObj('risks', i, 'mitigation', e.target.value)}
              placeholder="e.g. Cross-train two additional developers" />
            {form.risks.length > 1 && (
              <button type="button" className="btn-icon-remove" onClick={() => removeListItem('risks', i)}>✕</button>
            )}
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => addListItem('risks', { risk: '', mitigation: '' })}>
        + Add risk
      </button>
    </div>
  );
}

function StepApproval({ form, updateObj, addListItem, removeListItem }) {
  return (
    <div className="step-content">
      <p className="step-hint">Add the people who need to sign off on this charter.</p>
      <div className="table-input">
        <div className="table-input-header approval-header">
          <span>Name</span>
          <span>Role</span>
          <span>Date</span>
          <span />
        </div>
        {form.approvals.map((a, i) => (
          <div key={i} className="table-input-row approval-row">
            <input
              type="text" value={a.name}
              onChange={e => updateObj('approvals', i, 'name', e.target.value)}
              placeholder="Full name"
              autoFocus={i === 0} />
            <input
              type="text" value={a.role}
              onChange={e => updateObj('approvals', i, 'role', e.target.value)}
              placeholder="Role" />
            <input
              type="date" value={a.date}
              onChange={e => updateObj('approvals', i, 'date', e.target.value)} />
            {form.approvals.length > 1 && (
              <button type="button" className="btn-icon-remove" onClick={() => removeListItem('approvals', i)}>✕</button>
            )}
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => addListItem('approvals', { name: '', role: '', date: '' })}>
        + Add approver
      </button>
    </div>
  );
}

// ── Main wizard ──────────────────────────────────────────────────────────────

export default function CharterWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const total = STEPS.length;
  const current = STEPS[step];

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function updateList(field, index, value) {
    setForm(f => {
      const arr = [...f[field]];
      arr[index] = value;
      return { ...f, [field]: arr };
    });
  }

  function addListItem(field, template) {
    setForm(f => ({ ...f, [field]: [...f[field], template] }));
  }

  function removeListItem(field, index) {
    setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }));
  }

  function updateObj(field, index, key, value) {
    setForm(f => {
      const arr = [...f[field]];
      arr[index] = { ...arr[index], [key]: value };
      return { ...f, [field]: arr };
    });
  }

  function canProceed() {
    if (step === 0) return form.name.trim().length > 0;
    return true;
  }

  async function handleSubmit() {
    setError('');
    setSaving(true);
    try {
      const project = await createProject(form);
      navigate(`/project/${project._id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const stepProps = { form, update, updateList, addListItem, removeListItem, updateObj };

  return (
    <div className="wizard-shell">
      {/* Sidebar */}
      <aside className="wizard-sidebar">
        <div className="wizard-brand">Project Charter</div>
        <nav className="wizard-nav-list">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              className={`wizard-nav-item ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => i <= step && setStep(i)}
              disabled={i > step}
            >
              <span className="wizard-nav-icon">
                {i < step ? '✓' : s.icon}
              </span>
              <div className="wizard-nav-text">
                <span className="wizard-nav-title">{s.title}</span>
                <span className="wizard-nav-desc">{s.desc}</span>
              </div>
            </button>
          ))}
        </nav>
        <div className="wizard-sidebar-progress">
          <div className="wizard-progress-bar">
            <div className="wizard-progress-fill" style={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>
          <span>{step + 1} of {total} sections</span>
        </div>
      </aside>

      {/* Main panel */}
      <div className="wizard-main">
        <div className="wizard-main-header">
          <span className="wizard-step-icon">{current.icon}</span>
          <div>
            <h1>{current.title}</h1>
            <p>{current.desc}</p>
          </div>
        </div>

        <div className="wizard-body">
          {error && <div className="error-banner">{error}</div>}

          {step === 0 && <StepOverview {...stepProps} />}
          {step === 1 && <StepPurpose {...stepProps} />}
          {step === 2 && <StepDeliverables {...stepProps} />}
          {step === 3 && <StepTeam {...stepProps} />}
          {step === 4 && <StepTimeline {...stepProps} />}
          {step === 5 && <StepBudget {...stepProps} />}
          {step === 6 && <StepRisks {...stepProps} />}
          {step === 7 && <StepApproval {...stepProps} />}
        </div>

        <div className="wizard-footer">
          <button
            className="btn btn-secondary"
            onClick={() => step === 0 ? navigate('/') : setStep(s => s - 1)}
          >
            {step === 0 ? 'Cancel' : '← Back'}
          </button>

          {step < total - 1 ? (
            <button
              className="btn btn-primary"
              disabled={!canProceed()}
              onClick={() => setStep(s => s + 1)}
            >
              Next →
            </button>
          ) : (
            <button className="btn btn-primary" disabled={saving} onClick={handleSubmit}>
              {saving
                ? <><span className="btn-spinner" /> Generating Charter...</>
                : 'Generate Charter →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
