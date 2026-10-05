import { Route, Routes } from 'react-router-dom';
import ProgramList from './components/ProgramList';
import ProgramDetail from './components/ProgramDetail';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <div className="app">
      <div className="app-header">
        <ThemeToggle />
      </div>
      <Routes>
        <Route path="/" element={<ProgramList />} />
        <Route path="/program/:id" element={<ProgramDetail />} />
      </Routes>
    </div>
  );
}

export default App;
