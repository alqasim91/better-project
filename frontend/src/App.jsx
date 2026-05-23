import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProjectList from './components/ProjectList';
import CharterWizard from './components/CharterWizard';
import ProjectDashboard from './components/ProjectDashboard';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="app"><ProjectList /></div>} />
        <Route path="/new" element={<CharterWizard />} />
        <Route path="/project/:id" element={<ProjectDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
