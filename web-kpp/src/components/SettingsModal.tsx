import { useState } from 'react';

interface SettingsModalProps {
  workStart: string;
  workEnd: string;
  onSave: (newStart: string, newEnd: string) => void;
  onClose: () => void;
}

function SettingsModal({ workStart, workEnd, onSave, onClose }: SettingsModalProps) {
  const [start, setStart] = useState(workStart);
  const [end, setEnd] = useState(workEnd);

  const handleSave = () => {
    onSave(start, end);
    onClose();
  };

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      backgroundColor: 'rgba(0,0,0,0.9)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 100 
    }}>
      <div style={{ 
        backgroundColor: '#18181b', 
        padding: '40px', 
        borderRadius: '20px', 
        width: '520px', 
        maxWidth: '90%' 
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Настройки рабочего дня</h2>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#a3a3a3' }}>Понедельник — Пятница</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="time" 
              value={start} 
              onChange={(e) => setStart(e.target.value)} 
              style={{ flex: 1, padding: '12px', backgroundColor: '#27272a', border: 'none', borderRadius: '10px', color: 'white' }} 
            />
            <span style={{ alignSelf: 'center', color: '#a3a3a3' }}>—</span>
            <input 
              type="time" 
              value={end} 
              onChange={(e) => setEnd(e.target.value)} 
              style={{ flex: 1, padding: '12px', backgroundColor: '#27272a', border: 'none', borderRadius: '10px', color: 'white' }} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleSave}
            style={{ 
              flex: 1, 
              padding: '14px', 
              backgroundColor: '#10b981', 
              border: 'none', 
              borderRadius: '12px', 
              color: 'white' 
            }}
          >
            Сохранить
          </button>
          <button 
            onClick={onClose}
            style={{ 
              flex: 1, 
              padding: '14px', 
              backgroundColor: '#27272a', 
              border: 'none', 
              borderRadius: '12px', 
              color: 'white' 
            }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;