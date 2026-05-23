import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProjectList from './components/ProjectList';
import ProjectInputForm from './components/ProjectInputForm';
import ProjectDashboard from './components/ProjectDashboard';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/new" element={<ProjectInputForm />} />
          <Route path="/project/:id" element={<ProjectDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
