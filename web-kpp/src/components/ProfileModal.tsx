import { useState } from 'react';

interface ProfileModalProps {
  userFullName: string;
  onClose: () => void;
}

function ProfileModal({ userFullName, onClose }: ProfileModalProps) {
  const [hideData, setHideData] = useState(false);

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
        width: '460px', 
        maxWidth: '90%' 
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Профиль охранника</h2>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img 
            src="https://via.placeholder.com/400x500/1E40AF/FFFFFF?text=Фото+охранника" 
            style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover' }} 
            alt="Фото"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <strong>ФИО:</strong> {userFullName}
        </div>
        <div style={{ marginBottom: '30px' }}>
          <strong>Паспорт:</strong> {hideData ? '•••••• ••••••' : 'Данные скрыты'}
        </div>

        <button 
          onClick={() => setHideData(!hideData)}
          style={{ 
            width: '100%', 
            padding: '14px', 
            marginBottom: '20px', 
            backgroundColor: '#27272a', 
            border: 'none', 
            borderRadius: '12px', 
            color: 'white' 
          }}
        >
          {hideData ? 'Показать данные' : 'Скрыть данные'}
        </button>

        <button 
          onClick={onClose}
          style={{ 
            width: '100%', 
            padding: '14px', 
            backgroundColor: '#3b82f6', 
            border: 'none', 
            borderRadius: '12px', 
            color: 'white' 
          }}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}

export default ProfileModal;