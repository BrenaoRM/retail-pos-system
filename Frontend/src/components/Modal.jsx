/**
 * Modal Genérico Reutilizável
 * Suporta confirmação e mensagem customizável
 */

export function Modal({ titulo, mensagem, onConfirmar, onCancelar, tipo = 'confirmacao' }) {
  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <p className="modal-titulo">{titulo}</p>
        <p className="modal-sub">{mensagem}</p>
        <div className="modal-acoes">
          <button className="btn btn--ghost" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn btn--confirmar" onClick={onConfirmar}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
