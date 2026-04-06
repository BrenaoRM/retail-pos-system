import React, { useState } from 'react';
import './fechamento.css'; // Mova seu CSS do index.html para cá

const Fechamento = () => {
  // Estados para controlar o fluxo das telas
  const [etapa, setEtapa] = useState('setup');
  const [qtdEntregadores, setQtdEntregadores] = useState(0);
  const [nomesEntregadores, setNomesEntregadores] = useState([]);
  
  // Estados dos campos do formulário
  const [vendas, setVendas] = useState({
    salao: 0, deliveryWeb: 0, deliveryBundi: 0,
    caixaInicial: 0, maqSalao: 0, dinGaveta: 0,
    excedente: 0, maqRetirada: 0
  });

  // Estado dinâmico para os motoboys
  const [dadosMotoboys, setDadosMotoboys] = useState([]);

  // Função para configurar os nomes (Equivale ao configurarEntregadores do seu HTML)
  const configurarEquipe = () => {
    if (qtdEntregadores <= 0) return alert("Insira a quantidade!");
    setEtapa('nomes');
    setNomesEntregadores(new Array(Number(qtdEntregadores)).fill(''));
  };

  const confirmarNomes = () => {
    const iniciais = nomesEntregadores.map(nome => ({
      nome: nome || "Entregador",
      entregas: 0, maq: 0, din: 0, gas: 0
    }));
    setDadosMotoboys(iniciais);
    setEtapa('formulario');
  };

  const handleMotoboyChange = (index, campo, valor) => {
    const novosDados = [...dadosMotoboys];
    novosDados[index][campo] = Number(valor);
    setDadosMotoboys(novosDados);
  };

  return (
    <div className="container">
      {/* TELA DE SETUP INICIAL */}
      {etapa === 'setup' && (
        <div className="card setup-card anima-fade">
          <label>Quantos entregadores trabalharam hoje?</label>
          <input 
            type="number" 
            onChange={(e) => setQtdEntregadores(e.target.value)} 
          />
          <button className="btn btn-setup" onClick={configurarEquipe}>
            Definir Equipe
          </button>
        </div>
      )}

      {/* TELA DE NOMES */}
      {etapa === 'nomes' && (
        <div className="card setup-card anima-fade">
          <label>Nomes dos Entregadores:</label>
          {nomesEntregadores.map((_, i) => (
            <input 
              key={i}
              type="text" 
              placeholder={`Nome do motoboy ${i+1}`}
              onChange={(e) => {
                const novosNomes = [...nomesEntregadores];
                novosNomes[i] = e.target.value;
                setNomesEntregadores(novosNomes);
              }}
            />
          ))}
          <button className="btn btn-confirm" onClick={confirmarNomes}>
            Abrir Caixa
          </button>
        </div>
      )}

      {/* FORMULÁRIO PRINCIPAL (Refatorado do seu HTML original) */}
      {etapa === 'formulario' && (
        <div className="grid-setores anima-fade">
          <div className="card card-salao">
            <h3>🍽️ SALÃO</h3>
            <label>Vendas Totais (Mesas):</label>
            <input type="number" onChange={(e) => setVendas({...vendas, salao: e.target.value})} />
            <hr />
            <label>Caixa Inicial:</label>
            <input type="number" onChange={(e) => setVendas({...vendas, caixaInicial: e.target.value})} />
            <label>Maquininha Salão:</label>
            <input type="number" onChange={(e) => setVendas({...vendas, maqSalao: e.target.value})} />
            <label>Dinheiro (Gaveta):</label>
            <input type="number" onChange={(e) => setVendas({...vendas, dinGaveta: e.target.value})} />
          </div>

          <div className="card card-delivery">
            <h3>🛵 DELIVERY</h3>
            {dadosMotoboys.map((moto, i) => (
              <div key={i} className="card-motoboy">
                <span>🙋 {moto.nome}</span>
                <div className="grid-motoboy-inputs">
                  <input type="number" placeholder="Qtd" onChange={(e) => handleMotoboyChange(i, 'entregas', e.target.value)} />
                  <input type="number" placeholder="Maq" onChange={(e) => handleMotoboyChange(i, 'maq', e.target.value)} />
                  <input type="number" placeholder="Din" onChange={(e) => handleMotoboyChange(i, 'din', e.target.value)} />
                  <input type="number" placeholder="Gas" onChange={(e) => handleMotoboyChange(i, 'gas', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          
          <button className="btn btn-final" onClick={() => setEtapa('resultado')}>
            CALCULAR FECHAMENTO
          </button>
        </div>
      )}
    </div>
  );
};

export default Fechamento;