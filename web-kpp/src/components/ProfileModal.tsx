import React from 'react';
import { X, Shield, Calendar, Key, FileText } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, isDarkMode }) => {
  if (!isOpen) return null;

  const guardData = {
    fullName: 'Главный Администратор',
    username: 'admin',
    role: 'ADMIN',
    createdAt: '2026-05-18',
    passportNumber: '4512 987654',
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
        borderRadius: '24px', width: '100%', maxWidth: '550px',
        padding: '32px', position: 'relative',
        color: isDarkMode ? 'white' : '#0f172a',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        transition: 'all 0.2s'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '24px', right: '24px',
          backgroundColor: 'transparent', border: 'none',
          color: isDarkMode ? '#a3a3a3' : '#64748b', cursor: 'pointer',
          outline: 'none'
        }}>
          <X size={24} />
        </button>

        <h2 style={{ fontSize: '24px', marginBottom: '28px', fontWeight: 'bold' }}>Профиль сотрудника КПП</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '14px', color: isDarkMode ? '#a3a3a3' : '#64748b', marginBottom: '6px' }}>ФИО оператора</div>
            <div style={{ fontSize: '22px', fontWeight: '600' }}>{guardData.fullName}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '14px', color: isDarkMode ? '#a3a3a3' : '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={14} /> Логин
              </div>
              <div style={{ fontSize: '17px', fontFamily: 'monospace' }}>{guardData.username}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: isDarkMode ? '#a3a3a3' : '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} /> Роль в системе
              </div>
              <span style={{ 
                backgroundColor: '#3b82f6', color: 'white', 
                padding: '5px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' 
              }}>{guardData.role}</span>
            </div>
          </div>

          <div style={{ 
            backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', 
            padding: '18px', borderRadius: '16px',
            border: '1px solid ' + (isDarkMode ? 'transparent' : '#e4e4e7')
          }}>
            <div style={{ fontSize: '14px', color: isDarkMode ? '#a3a3a3' : '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={15} /> Паспортные данные сотрудника
            </div>
            <div style={{ fontSize: '20px', fontWeight: '500', letterSpacing: '1px', color: isDarkMode ? 'white' : '#0f172a' }}>
              {guardData.passportNumber}
            </div>
          </div>

          <div style={{ marginTop: '8px', fontSize: '14px', color: isDarkMode ? '#71717a' : '#9ca3af', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} /> Аккаунт зарегистрирован: {guardData.createdAt}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;