import { Route, Routes } from 'react-router-dom';
import ProgramList from './components/ProgramList';
import ProgramDetail from './components/ProgramDetail';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<ProgramList />} />
        <Route path="/program/:id" element={<ProgramDetail />} />
      </Routes>
    </div>
  );
}

export default App;
