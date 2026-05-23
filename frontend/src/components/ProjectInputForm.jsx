import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../api';

const emptyPhase = { name: '', startDate: '', endDate: '', description: '' };
const emptyResource = { name: '', role: '' };

export default function ProjectInputForm() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    objectives: '',
    scope: '',
    risks: '',
    phases: [{ ...emptyPhase }],
    resources: [{ ...emptyResource }],
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updatePhase(index, field, value) {
    setForm((prev) => {
      const phases = [...prev.phases];
      phases[index] = { ...phases[index], [field]: value };
      return { ...prev, phases };
    });
  }

  function addPhase() {
    setForm((prev) => ({ ...prev, phases: [...prev.phases, { ...emptyPhase }] }));
  }

  function removePhase(index) {
    setForm((prev) => ({ ...prev, phases: prev.phases.filter((_, i) => i !== index) }));
  }

  function updateResource(index, field, value) {
    setForm((prev) => {
      const resources = [...prev.resources];
      resources[index] = { ...resources[index], [field]: value };
      return { ...prev, resources };
    });
  }

  function addResource() {
    setForm((prev) => ({ ...prev, resources: [...prev.resources, { ...emptyResource }] }));
  }

  function removeResource(index) {
    setForm((prev) => ({ ...prev, resources: prev.resources.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    setEnhancing(true);

    try {
      const project = await createProject(form);
      navigate(`/project/${project._id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
      setEnhancing(false);
    }
  }

  return (
    <div className="form-container">
      <h1>Create Project Charter</h1>

      {error && <div className="error-banner">{error}</div>}

      {enhancing && (
        <div className="enhancing-banner">
          <div className="enhancing-spinner" />
          Enhancing with AI — building your professional charter...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <section className="form-section">
          <h2>Project Information</h2>
          <div className="form-group">
            <label htmlFor="name">Project Name *</label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Enter project name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Brief project description"
            />
          </div>
          <div className="form-group">
            <label htmlFor="objectives">Objectives</label>
            <textarea
              id="objectives"
              rows={3}
              value={form.objectives}
              onChange={(e) => updateField('objectives', e.target.value)}
              placeholder="Key project objectives (bullet points or notes are fine)"
            />
          </div>
          <div className="form-group">
            <label htmlFor="scope">Scope</label>
            <textarea
              id="scope"
              rows={3}
              value={form.scope}
              onChange={(e) => updateField('scope', e.target.value)}
              placeholder="Define project scope"
            />
          </div>
          <div className="form-group">
            <label htmlFor="risks">Risks</label>
            <textarea
              id="risks"
              rows={3}
              value={form.risks}
              onChange={(e) => updateField('risks', e.target.value)}
              placeholder="Identified risks (notes are fine — AI will structure them)"
            />
          </div>
        </section>

        {/* Phases */}
        <section className="form-section">
          <h2>Project Phases</h2>
          {form.phases.map((phase, i) => (
            <div key={i} className="card repeatable-item">
              <div className="card-header">
                <h3>Phase {i + 1}</h3>
                {form.phases.length > 1 && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removePhase(i)}>
                    Remove
                  </button>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phase Name</label>
                  <input
                    type="text"
                    value={phase.name}
                    onChange={(e) => updatePhase(i, 'name', e.target.value)}
                    placeholder="Phase name"
                  />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={phase.startDate}
                    onChange={(e) => updatePhase(i, 'startDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={phase.endDate}
                    onChange={(e) => updatePhase(i, 'endDate', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={2}
                  value={phase.description}
                  onChange={(e) => updatePhase(i, 'description', e.target.value)}
                  placeholder="Phase description"
                />
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={addPhase}>
            + Add Phase
          </button>
        </section>

        {/* Resources */}
        <section className="form-section">
          <h2>Resources</h2>
          {form.resources.map((resource, i) => (
            <div key={i} className="card repeatable-item">
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={resource.name}
                    onChange={(e) => updateResource(i, 'name', e.target.value)}
                    placeholder="Resource name"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={resource.role}
                    onChange={(e) => updateResource(i, 'role', e.target.value)}
                    placeholder="Role"
                  />
                </div>
                {form.resources.length > 1 && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeResource(i)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={addResource}>
            + Add Resource
          </button>
        </section>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating Charter...' : 'Create Project Charter'}
          </button>
        </div>
      </form>
    </div>
  );
}
