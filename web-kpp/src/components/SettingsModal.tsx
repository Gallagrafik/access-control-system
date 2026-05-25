import React, { useState, useEffect } from 'react';
import { X, Sliders, Monitor, ShieldAlert, Clock } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onScheduleUpdate?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isDarkMode, onScheduleUpdate }) => {
  const [workStart, setWorkStart] = useState('08:00');
  const [workEnd, setWorkEnd] = useState('20:00');
  const [requestExpiryHours, setRequestExpiryHours] = useState(8);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('http://localhost:3000/api/settings/schedule')
        .then(res => {
          if (!res.ok) throw new Error('Ошибка загрузки');
          return res.json();
        })
        .then(data => {
          if (data) {
            setWorkStart(data.startTime || '08:00');
            setWorkEnd(data.endTime || '20:00');
            setRequestExpiryHours(data.requestExpiryHours || 8);
          }
        })
        .catch(err => {
          console.error('Ошибка загрузки настроек:', err);
        });
    }
  }, [isOpen]);

  const handleSave = async () => {
    setLoading(true);
    setSaveError(null);
    try {
      const today = new Date().getDay();
      const response = await fetch(`http://localhost:3000/api/settings/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dayOfWeek: today,
          startTime: workStart, 
          endTime: workEnd,
          requestExpiryHours: requestExpiryHours
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка сохранения');
      }
      
      if (onScheduleUpdate) {
        onScheduleUpdate();
      }
      
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      setSaveError(error instanceof Error ? error.message : 'Не удалось сохранить настройки');
    } finally {
      setLoading(false);
    }
  };

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
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '24px', right: '24px',
          background: 'transparent', border: 'none',
          color: isDarkMode ? '#a3a3a3' : '#64748b', cursor: 'pointer',
        }}>
          <X size={24} />
        </button>

        <h2 style={{ fontSize: '24px', marginBottom: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sliders color="#eab308" /> Настройки КПП
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ 
            backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', 
            padding: '16px', borderRadius: '16px',
            border: '1px solid ' + (isDarkMode ? 'transparent' : '#e4e4e7')
          }}>
            <div style={{ fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="#3b82f6" /> Настройки рабочего дня
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: isDarkMode ? '#a3a3a3' : '#64748b', display: 'block', marginBottom: '6px' }}>
                  Начало смены
                </label>
                <input 
                  type="time" 
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                    color: isDarkMode ? 'white' : '#0f172a',
                    border: '1px solid ' + (isDarkMode ? '#3f3f46' : '#e4e4e7'),
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: isDarkMode ? '#a3a3a3' : '#64748b', display: 'block', marginBottom: '6px' }}>
                  Конец смены
                </label>
                <input 
                  type="time" 
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                    color: isDarkMode ? 'white' : '#0f172a',
                    border: '1px solid ' + (isDarkMode ? '#3f3f46' : '#e4e4e7'),
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: isDarkMode ? '#a3a3a3' : '#64748b', display: 'block', marginBottom: '6px' }}>
                Считать заявку просроченной через (часов):
              </label>
              <input 
                type="number" 
                value={requestExpiryHours}
                onChange={(e) => setRequestExpiryHours(Number(e.target.value))}
                min="1"
                max="24"
                step="1"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                  color: isDarkMode ? 'white' : '#0f172a',
                  border: '1px solid ' + (isDarkMode ? '#3f3f46' : '#e4e4e7'),
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <p style={{ fontSize: '11px', color: isDarkMode ? '#71717a' : '#9ca3af', marginTop: '6px' }}>
                Если заявка не обработана в течение указанного времени, она автоматически становится просроченной
              </p>
            </div>
          </div>

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

          <div style={{ 
            backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', 
            padding: '16px', borderRadius: '16px',
            border: '1px solid ' + (isDarkMode ? 'transparent' : '#e4e4e7')
          }}>
            <div style={{ fontWeight: '600', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e' }}>
              <ShieldAlert size={16} /> Логирование инцидентов
            </div>
            <p style={{ fontSize: '13px', color: isDarkMode ? '#a3a3a3' : '#64748b', marginBottom: '12px' }}>
              Автоматически создавать тревожный тикет в accessLog при нажатии кнопки Задержать.
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
              <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: '#f43f5e' }} />
              Включено (Рекомендуется для протокола АБ)
            </label>
          </div>

          {saveError && (
            <div style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center', padding: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
              {saveError}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '14px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;