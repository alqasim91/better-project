import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProjects } from '../api';

export default function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    fetchProjects(controller.signal)
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });
  }, []);

  return (
    <div className="project-list">
      <div className="page-header">
        <h1>Better Project</h1>
        <p>Create and visualize project charters</p>
        <button className="btn btn-primary" onClick={() => navigate('/new')}>
          + New Project Charter
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <h2>No projects yet</h2>
          <p>Create your first project charter to get started.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div
              key={project._id}
              className="project-card"
              onClick={() => navigate(`/project/${project._id}`)}
            >
              <h3>{project.name}</h3>
              {project.description && <p>{project.description}</p>}
              <div className="project-card-meta">
                <span>{project.phases?.length || 0} phases</span>
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
