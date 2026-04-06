import React, { useState, useEffect } from 'react';
import './Fechamento.css';

const Fechamento = () => {
    // Estados de fluxo da tela
    const [etapa, setEtapa] = useState('setup'); // 'setup', 'formulario', 'resultado'
    const [qtdEntregadores, setQtdEntregadores] = useState('');
    const [nomesEntregadores, setNomesEntregadores] = useState([]);

    // Estados de valores do Salão
    const [salao, setSalao] = useState({
        vendaSist: 0, inicial: 0, maq: 0, din: 0, excedente: 0
    });

    // Estados de valores do Delivery
    const [delivery, setDelivery] = useState({
        vendaWeb: 0, vendaBundi: 0, maqRetirada: 0
    });

    // Estado dinâmico para motoboys
    const [dadosMotoboys, setDadosMotoboys] = useState([]);

    // Resultados finais para o relatório
    const [relatorio, setRelatorio] = useState(null);

    const configurarEquipe = () => {
        if (!qtdEntregadores || qtdEntregadores <= 0) return alert("Insira a quantidade de entregadores.");
        setNomesEntregadores(new Array(Number(qtdEntregadores)).fill(''));
        setEtapa('nomes');
    };

    const confirmarNomes = () => {
        const iniciais = nomesEntregadores.map(nome => ({
            nome: nome.trim() || "Entregador",
            qtd: 0, maq: 0, din: 0, gas: 0
        }));
        setDadosMotoboys(iniciais);
        setEtapa('formulario');
    };

    const handleMotoboyChange = (index, campo, valor) => {
        const novosDados = [...dadosMotoboys];
        novosDados[index][campo] = Number(valor) || 0;
        setDadosMotoboys(novosDados);
    };

    const calcularTudo = () => {
        // Lógica Salão
        const realSalao = (salao.din - salao.inicial) + salao.maq;
        const difSalao = (realSalao - salao.excedente) - salao.vendaSist;

        // Lógica Delivery
        const sistDeliv = delivery.vendaWeb + delivery.vendaBundi;
        const totalMaqEnt = dadosMotoboys.reduce((acc, m) => acc + m.maq, 0);
        const totalDinEnt = dadosMotoboys.reduce((acc, m) => acc + m.din, 0);
        const totalGasEnt = dadosMotoboys.reduce((acc, m) => acc + m.gas, 0);

        const realDeliv = delivery.maqRetirada + totalMaqEnt + totalDinEnt + totalGasEnt;
        const difDeliv = realDeliv - sistDeliv;

        setRelatorio({
            sistSalao: salao.vendaSist,
            realSalao,
            excedente: salao.excedente,
            difSalao,
            sistDeliv,
            realDeliv: (delivery.maqRetirada + totalMaqEnt + totalDinEnt),
            totalGasEnt,
            difDeliv,
            totalGeral: difSalao + difDeliv
        });
        setEtapa('resultado');
    };

    // Scroll suave para o resultado igual ao original
    useEffect(() => {
        if (etapa === 'resultado') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, [etapa]);

    return (
        <div className={`container ${etapa === 'setup' ? 'centering-setup' : ''}`}>
            {etapa !== 'formulario' && etapa !== 'resultado' && (
                <div id="logoTopo" style={{ alignSelf: 'flex-start', marginBottom: '20px' }}>
                    <img src="/img/logo.png" alt="Logo Big Pizza" style={{ maxWidth: '180px' }} />
                </div>
            )}

            {etapa === 'setup' && (
                <div className="card anima-fade">
                    <label>Quantos entregadores trabalharam hoje?</label>
                    <div className="flex-col-center">
                        <input type="number" value={qtdEntregadores} onChange={(e) => setQtdEntregadores(e.target.value)} className="input-qtd-setup" />
                        <button className="btn btn-setup" onClick={configurarEquipe}>Definir Equipe</button>
                    </div>
                </div>
            )}

            {etapa === 'nomes' && (
                <div className="card anima-fade">
                    <label>Nomes dos Entregadores:</label>
                    {nomesEntregadores.map((_, i) => (
                        <input key={i} type="text" className="input-nome" placeholder={`Nome ${i + 1}`} 
                            onChange={(e) => {
                                const n = [...nomesEntregadores];
                                n[i] = e.target.value;
                                setNomesEntregadores(n);
                            }} 
                        />
                    ))}
                    <button className="btn btn-setup btn-confirm" onClick={confirmarNomes}>Confirmar e Abrir Caixa</button>
                </div>
            )}

            {etapa === 'formulario' && (
                <div className="anima-fade" style={{ width: '100%' }}>
                    <div className="grid-setores">
                        <div className="card card-salao">
                            <h3>🍽️ SALÃO</h3>
                            <label>Vendas Totais (Mesas):</label>
                            <input type="number" onChange={(e) => setSalao({...salao, vendaSist: Number(e.target.value)})} />
                            <hr />
                            <label>Caixa Inicial (Troco):</label>
                            <input type="number" onChange={(e) => setSalao({...salao, inicial: Number(e.target.value)})} />
                            <label>Maquininha Salão:</label>
                            <input type="number" onChange={(e) => setSalao({...salao, maq: Number(e.target.value)})} />
                            <label>Dinheiro Físico (Gaveta):</label>
                            <input type="number" onChange={(e) => setSalao({...salao, din: Number(e.target.value)})} />
                            <label>Excedente (Funcionários):</label>
                            <input type="number" onChange={(e) => setSalao({...salao, excedente: Number(e.target.value)})} />
                        </div>

                        <div className="card card-delivery">
                            <h3>🛵 DELIVERY / RETIRADA</h3>
                            <label>Web Cardápio:</label>
                            <input type="number" onChange={(e) => setDelivery({...delivery, vendaWeb: Number(e.target.value)})} />
                            <label>App Bundi:</label>
                            <input type="number" onChange={(e) => setDelivery({...delivery, vendaBundi: Number(e.target.value)})} />
                            <hr />
                            <label>Maquininha Retirada (Balcão):</label>
                            <input type="number" onChange={(e) => setDelivery({...delivery, maqRetirada: Number(e.target.value)})} />
                            <h4>Acerto dos Motoboys:</h4>
                            {dadosMotoboys.map((m, i) => (
                                <div key={i} className="card-motoboy">
                                    <span className="badge-entrega">🙋 {m.nome}</span>
                                    <div className="grid-motoboy-inputs">
                                        <input type="number" placeholder="Entregas" onChange={(e) => handleMotoboyChange(i, 'qtd', e.target.value)} />
                                        <input type="number" placeholder="Maq" onChange={(e) => handleMotoboyChange(i, 'maq', e.target.value)} />
                                        <input type="number" placeholder="Din" onChange={(e) => handleMotoboyChange(i, 'din', e.target.value)} />
                                        <input type="number" placeholder="Gas" onChange={(e) => handleMotoboyChange(i, 'gas', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button className="btn btn-final" onClick={calcularTudo}>CALCULAR FECHAMENTO</button>
                </div>
            )}

            {etapa === 'resultado' && relatorio && (
                <div id="resultado" style={{ display: 'block' }} className={`${Math.abs(relatorio.totalGeral) < 1 ? 'dif-positiva' : 'dif-negativa'} anima-fade`}>
                    <h3 className="titulo-relatorio">📋 RESULTADO DO FECHAMENTO</h3>
                    <div className="grid-setores">
                        <div className="card-resultado">
                            <h4 className="tit-salao">🍽️ SALÃO</h4>
                            <p>📈 Esperado: R$ {relatorio.sistSalao.toFixed(2)}</p>
                            <p>💵 Real: R$ {relatorio.realSalao.toFixed(2)}</p>
                            <p>🍔 Excedente: - R$ {relatorio.excedente.toFixed(2)}</p>
                            <hr />
                            <p><strong>Diferença: R$ {relatorio.difSalao.toFixed(2)}</strong></p>
                        </div>
                        <div className="card-resultado">
                            <h4 className="tit-delivery">🛵 DELIVERY</h4>
                            <p>📈 Esperado: R$ {relatorio.sistDeliv.toFixed(2)}</p>
                            <p>💵 Real: R$ {relatorio.realDeliv.toFixed(2)}</p>
                            <p>⛽ Gasolina: + R$ {relatorio.totalGasEnt.toFixed(2)}</p>
                            <hr />
                            <p><strong>Diferença: R$ {relatorio.difDeliv.toFixed(2)}</strong></p>
                        </div>
                    </div>
                    <hr />
                    <div className="res-final">
                        <h2>💵 Diferença Total: R$ {relatorio.totalGeral.toFixed(2)}</h2>
                        <p>{Math.abs(relatorio.totalGeral) < 1 ? "✅ Caixa Fechado!" : "⚠️ Verifique as divergências."}</p>
                        <button className="btn btn-setup" onClick={() => window.location.reload()}>Novo Fechamento</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Fechamento;