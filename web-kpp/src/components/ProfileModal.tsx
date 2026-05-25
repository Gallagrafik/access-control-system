import React from 'react';
import { X, Shield, Calendar, Key, FileText, Image as ImageIcon } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, isDarkMode }) => {
  if (!isOpen) return null;

  // Мокаем данные охранника (позже свяжем с базой данных)
  const guardData = {
    fullName: 'Главный Администратор',
    username: 'admin',
    role: 'ADMIN',
    createdAt: '2026-05-18',
    passportNumber: '4512 987654',
    // Динамический шаблон ссылки, аналогичный юзеру (Инициалы: ГА)
    archivePhotoUrl: 'http://192.168.0' 
  };

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
        borderRadius: '24px', width: '100%', maxWidth: '700px',
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

        <h2 style={{ fontSize: '24px', marginBottom: '24px', fontWeight: 'bold' }}>Профиль сотрудника КПП</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '32px' }}>
          {/* Левая колонка: Архивное фото */}
          <div>
            <div style={{ fontSize: '13px', color: isDarkMode ? '#a3a3a3' : '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ImageIcon size={14} /> Архивное фото КПП
            </div>
            <img 
              src={guardData.archivePhotoUrl} 
              style={{ 
                width: '100%', 
                height: '250px', 
                objectFit: 'cover', 
                borderRadius: '16px', 
                backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5',
                border: '1px solid ' + (isDarkMode ? '#3f3f46' : '#e4e4e7')
              }} 
              onError={(e) => e.currentTarget.src = 'https://placeholder.com'}
            />
          </div>

          {/* Правая колонка: Данные */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', color: isDarkMode ? '#a3a3a3' : '#64748b', marginBottom: '4px' }}>ФИО оператора</div>
              <div style={{ fontSize: '20px', fontWeight: '600' }}>{guardData.fullName}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: isDarkMode ? '#a3a3a3' : '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Key size={12} /> Логин
                </div>
                <div style={{ fontSize: '16px', fontFamily: 'monospace' }}>{guardData.username}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: isDarkMode ? '#a3a3a3' : '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={12} /> Роль в системе
                </div>
                <span style={{ 
                  backgroundColor: '#3b82f6', color: 'white', 
                  padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' 
                }}>{guardData.role}</span>
              </div>
            </div>

            {/* Карточка паспортных данных */}
            <div style={{ 
              backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', 
              padding: '16px', borderRadius: '16px',
              border: '1px solid ' + (isDarkMode ? 'transparent' : '#e4e4e7')
            }}>
              <div style={{ fontSize: '13px', color: isDarkMode ? '#a3a3a3' : '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} /> Паспортные данные сотрудника
              </div>
              <div style={{ fontSize: '18px', fontWeight: '500', letterSpacing: '1px', color: isDarkMode ? 'white' : '#0f172a' }}>
                {guardData.passportNumber}
              </div>
            </div>

            <div style={{ marginTop: 'auto', fontSize: '13px', color: isDarkMode ? '#71717a' : '#9a9a1a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Аккаунт зарегистрирован: {guardData.createdAt}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal; // Дефолтный экспорт без фигурных скобок