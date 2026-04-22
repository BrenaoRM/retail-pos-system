# 🔄 Plano de Refatoração - Fechamento.jsx

## 📋 Status Atual
- **Linhas:** ~700
- **Estados:** 10+
- **Funções:** 15+
- **Responsabilidades:** 8+
- **Manutenibilidade:** 7/10

---

## 🎯 Objetivo
Dividir `Fechamento.jsx` em componentes menores, reutilizáveis e testáveis

## 📊 Estrutura Proposta

```
src/
├── hooks/
│   └── useFechamento.js          ← Lógica e estado centralizado
├── components/
│   ├── Icons.jsx                 ← Ícones compartilhados
│   ├── Modal.jsx                 ← Modal genérico
│   └── Campo.jsx                 ← Input monetário reutilizável
├── pages/Fechamento/
│   ├── Fechamento.jsx            ← Composição (~150 linhas)
│   ├── FormularioFechamento.jsx  ← Renderização formulário (~200 linhas)
│   ├── ResultadoFechamento.jsx   ← Renderização resultado (~150 linhas)
│   ├── SecaoMotoboys.jsx         ← Seção motoboys (~80 linhas)
│   └── Fechamento.css
└── lib/
    ├── format.js                 ← ✅ Já feito!
    └── api.js
```

---

## 🔍 Detalhamento dos Componentes

### 1. **`hooks/useFechamento.js`** (Hook Customizado)

**Responsabilidade:** Toda lógica de negócio e estado

**O que incluir:**
```javascript
export function useFechamento() {
  const [etapa, setEtapa] = useState('formulario');
  const [aba, setAba] = useState('salao');
  const [salao, setSalao] = useState(SALAO_VAZIO);
  const [delivery, setDelivery] = useState(DELIVERY_VAZIO);
  const [motoboys, setMotoboys] = useState([MOTOBOY_NOVO(1)]);
  const [relatorio, setRelatorio] = useState(null);
  const [erros, setErros] = useState({});
  
  // Métodos
  const calcular = async () => { /* ... */ };
  const validar = () => { /* ... */ };
  const novoFechamento = () => { /* ... */ };
  const editarMotoboy = (i, campo, val) => { /* ... */ };
  
  // Persistência
  useEffect(() => {
    if (etapa === 'formulario') {
      salvarRascunho({ salao, delivery, motoboys });
    }
  }, [salao, delivery, motoboys, etapa]);
  
  return {
    // Estado
    etapa, aba, salao, delivery, motoboys, relatorio, erros,
    // Métodos
    setEtapa, setAba, setSalao, setDelivery, setMotoboys,
    setErros, calcular, validar, novoFechamento, editarMotoboy,
    // Computed
    subtotais: { /* ... */ },
  };
}
```

**Benefício:** Hook reutilizável, testável, e separado da UI

---

### 2. **`components/Icons.jsx`** (Ícones Compartilhados)

**Responsabilidade:** Centralizar todos os ícones SVG

**Estrutura:**
```javascript
export const IconStore = () => ( /* SVG */ );
export const IconBike = () => ( /* SVG */ );
export const IconCheck = () => ( /* SVG */ );
export const IconAlert = () => ( /* SVG */ );
export const IconRefresh = () => ( /* SVG */ );
export const IconCamera = () => ( /* SVG */ );
export const IconEye = () => ( /* SVG */ );
```

**Uso:**
```javascript
import { IconStore, IconBike, IconCamera } from '../components/Icons';
```

**Benefício:** Reutilizar em Fechamento, Historico, Login

---

### 3. **`components/Modal.jsx`** (Modal Genérico)

**Antes:** Implementações diferentes em Fechamento e Historico

**Depois:** Um único componente reutilizável

```javascript
export function Modal({ titulo, mensagem, onConfirmar, onCancelar, tipo = 'confirmacao' }) {
  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <p className="modal-titulo">{titulo}</p>
        <p className="modal-sub">{mensagem}</p>
        <div className="modal-acoes">
          <button onClick={onCancelar}>{onCancelar?.text || 'Cancelar'}</button>
          <button onClick={onConfirmar}>{onConfirmar?.text || 'Confirmar'}</button>
        </div>
      </div>
    </div>
  );
}
```

---

### 4. **`pages/Fechamento/FormularioFechamento.jsx`** (~200 linhas)

**Responsabilidade:** Renderizar o formulário

**Props:**
```javascript
<FormularioFechamento
  aba={aba}
  onAbaChange={setAba}
  salao={salao}
  onSalaoChange={setSalao}
  delivery={delivery}
  onDeliveryChange={setDelivery}
  motoboys={motoboys}
  onMotoboysChange={setMotoboys}
  erros={erros}
  subtotais={subtotais}
  onCalcular={calcular}
/>
```

**Contém:**
- Toggle de abas (Salão/Delivery)
- Slides com swipe
- Todos os inputs
- Seção de motoboys

---

### 5. **`pages/Fechamento/ResultadoFechamento.jsx`** (~150 linhas)

**Responsabilidade:** Renderizar o resultado

**Props:**
```javascript
<ResultadoFechamento
  relatorio={relatorio}
  motoboys={motoboys}
  onVoltar={handleVoltar}
  onCopiar={copiarImagem}
  onNovoFechamento={novoFechamento}
/>
```

**Contém:**
- Hero com valor total
- Cards de resumo (Salão/Delivery)
- Detalhes por motoboy
- Botões de ação

---

### 6. **`pages/Fechamento/SecaoMotoboys.jsx`** (~80 linhas)

**Responsabilidade:** Gerenciar motoboys

**Props:**
```javascript
<SecaoMotoboys
  motoboys={motoboys}
  onChange={setMotoboys}
/>
```

**Contém:**
- Adicionar/remover motoboys
- Editar dados
- Avatares

---

### 7. **`components/Campo.jsx`** (Input Monetário Reutilizável)

**Mover de:** Função interna em Fechamento

**Props:**
```javascript
<Campo
  label="Venda total"
  value={1234.56}
  onChange={handleChange}
  erro={erroMessage}
/>
```

**Reutilizável em:**
- Formulários de Plano
- Formulários de admin
- Histórico (edição)

---

## 🔨 Passo a Passo de Implementação

### Fase 1: Preparação (30 min)
1. Criar pasta `src/hooks/`
2. Criar pasta `src/components/`
3. Criar `Icons.jsx` com todos os ícones
4. Criar `Modal.jsx` genérico

### Fase 2: Extração de Lógica (45 min)
1. Criar `useFechamento.js` com toda lógica
2. Testar hook isoladamente
3. Remover lógica de Fechamento.jsx

### Fase 3: Decomposição de UI (45 min)
1. Criar `FormularioFechamento.jsx`
2. Criar `ResultadoFechamento.jsx`
3. Criar `SecaoMotoboys.jsx`
4. Simplificar `Fechamento.jsx` para composição

### Fase 4: Testes & Limpeza (30 min)
1. Verificar functionality
2. Remover duplicação de CSS
3. Atualizar imports em outros componentes
4. Documentar componentes

---

## ✅ Checklist de Validação

- [ ] `Fechamento.jsx` < 200 linhas
- [ ] `FormularioFechamento.jsx` < 250 linhas
- [ ] `ResultadoFechamento.jsx` < 200 linhas
- [ ] Sem erros de linting
- [ ] Sem console.errors na execução
- [ ] Todas as funcionalidades mantidas
- [ ] Formulário preserva dados ao sair
- [ ] Resultado calcula corretamente
- [ ] Copiar imagem funciona
- [ ] Novo fechamento limpa tudo

---

## 📊 Impacto Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| **Linhas principais** | 700 | 150 |
| **Componentes** | 1 | 5 |
| **Hooks** | 0 | 1 |
| **Testabilidade** | Baixa | Alta |
| **Reutilização** | Nenhuma | 60% |
| **Manutenibilidade** | 7/10 | 9/10 |

---

## 🚀 Benefícios

1. ✅ Código mais legível
2. ✅ Componentes reutilizáveis
3. ✅ Fácil de testar
4. ✅ Fácil de debugar
5. ✅ Fácil adicionar features
6. ✅ Melhor performance (memoização possível)
7. ✅ Melhor experiência do dev

---

## 💡 Próximos Passos

1. Seguir Prioridade 2
2. Implementar componentes propostos
3. Adicionar testes unitários
4. Documentar com Storybook (opcional)
