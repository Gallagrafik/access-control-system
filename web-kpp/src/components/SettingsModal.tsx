import React from 'react';
import { X, Sliders, Monitor, ShieldAlert } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isDarkMode }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 100,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
        border: '1px solid ' + (isDarkMode ? '#27272a' : '#e4e4e7'),
        borderRadius: '24px', width: '100%', maxWidth: '550px',
        padding: '32px', position: 'relative',
        color: isDarkMode ? 'white' : '#0f172a',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        transition: 'all 0.2s'
      }}>
        {/* Кнопка закрытия */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '24px', right: '24px',
          backgroundColor: 'transparent', border: 'none',
          color: isDarkMode ? '#a3a3a3' : '#64748b', cursor: 'pointer',
          outline: 'none'
        }}>
          <X size={24} />
        </button>

        <h2 style={{ fontSize: '24px', marginBottom: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sliders color="#eab308" /> Настройки КПП
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Секция режима оборудования */}
          <div style={{ 
            backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', 
            padding: '16px', borderRadius: '16px',
            border: '1px solid ' + (isDarkMode ? 'transparent' : '#e4e4e7')
          }}>
            <div style={{ fontWeight: '600', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Monitor size={16} color="#3b82f6" /> Режим видоискателя
            </div>
            <p style={{ fontSize: '13px', color: isDarkMode ? '#a3a3a3' : '#64748b', marginBottom: '12px' }}>
              Определяет тип кадрирования поступающей биометрии с мобильных устройств сотрудников.
            </p>
            <select style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
              color: isDarkMode ? 'white' : '#0f172a',
              border: '1px solid ' + (isDarkMode ? '#3f3f46' : '#e4e4e7'),
              fontSize: '14px', outline: 'none'
            }}>
              <option>Пропорции 3х4 (Строгий Кроп биометрии)</option>
              <option>Полноэкранный режим (Оригинал матрицы)</option>
            </select>
          </div>

          {/* Секция безопасности */}
          <div style={{ 
            backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', 
            padding: '16px', borderRadius: '16px',
            border: '1px solid ' + (isDarkMode ? 'transparent' : '#e4e4e7')
          }}>
            <div style={{ fontWeight: '600', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e' }}>
              <ShieldAlert size={16} /> Логирование инцидентов
            </div>
            <p style={{ fontSize: '13px', color: isDarkMode ? '#a3a3a3' : '#64748b', marginBottom: '12px' }}>
              Автоматически создавать тревожный тикет в `accessLog` при нажатии кнопки «Задержать».
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
              <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: '#f43f5e' }} />
              Включено (Рекомендуется для протокола АБ)
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; // Дефолтный экспорт без фигурных скобок
