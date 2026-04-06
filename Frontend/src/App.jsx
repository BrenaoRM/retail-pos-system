import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Fechamento from './pages/Fechamento/Fechamento';
// O Login será importado aqui em breve

function App() {
  return (
    <Router>
      <Routes>
        {/* Definimos o formulário de fechamento como a rota inicial por enquanto */}
        <Route path="/" element={<Fechamento />} />
      </Routes>
    </Router>
  );
}

export default App;