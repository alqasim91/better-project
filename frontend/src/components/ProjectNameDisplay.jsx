import { useNavigate } from 'react-router-dom';

export default function ProjectNameDisplay({ project }) {
  const navigate = useNavigate();

  if (!project) {
    return (
      <div className="empty-state">
        <h2>No Project Selected</h2>
        <p>Create a new project charter to get started.</p>
        <button className="btn btn-primary" onClick={() => navigate('/new')}>
          Create Project
        </button>
      </div>
    );
  }

  return (
    <div className="project-header">
      <h1>{project.name}</h1>
      {project.description && <p className="project-description">{project.description}</p>}
      <div className="project-meta">
        <span>{project.phases?.length || 0} Phases</span>
        <span>{project.resources?.length || 0} Resources</span>
        <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
