import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Sun, 
  Moon, 
  Settings, 
  UserCheck, 
  Clock 
} from 'lucide-react';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';

interface AccessRequest {
  id: string;
  code: string;
  requestType: 'IN' | 'OUT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  fullName?: string;
  position?: string;
  selfieUrl?: string;
  archivePhotoUrl?: string;
  user?: {
    fullName: string;
    position: string;
  };
}

interface MainScreenProps {
  onLogout: () => void;
}

const MainScreen: React.FC<MainScreenProps> = ({ onLogout }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [requests, setRequests] = useState<AccessRequest[]>([]);

  const workStart = "08:00";
  const workEnd = "20:00";

  // Загрузка активных заявок с бэкенда NestJS
  const fetchRequests = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/access-request/active');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000); // Автообновление каждые 5 сек
    return () => clearInterval(interval);
  }, []);

  // Кнопка "Пропустить"
  const handlePass = async (id: string, name: string) => {
    try {
      const response = await fetch(`hhttp://localhost:3000/api/access-request/process/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      if (response.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Ошибка обработки заявки:', error);
    }
  };

  // Кнопка "Задержать"
  const handleReject = async (id: string, name: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/access-request/process/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT' }),
      });
      if (response.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Ошибка обработки заявки:', error);
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Фильтруем заявки на вход и выход
  const inRequests = requests.filter(req => req.requestType === 'IN');
  const outRequests = requests.filter(req => req.requestType === 'OUT');

  return (
    <div style={{ 
      backgroundColor: isDarkMode ? '#09090b' : '#f8fafc', 
      color: isDarkMode ? 'white' : '#0f172a',
      minHeight: '100vh',
      transition: 'all 0.2s'
    }}>
      {/* Шапка рабочего места */}
      <header style={{ 
        backgroundColor: isDarkMode ? '#18181b' : '#ffffff', 
        borderBottom: '1px solid ' + (isDarkMode ? '#27272a' : '#e4e4e7'),
        padding: '16px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <UserCheck size={40} color="#3b82f6" />
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>КПП • Контроль доступа</h1>
            <p style={{ color: isDarkMode ? '#a3a3a3' : '#64748b', margin: '4px 0 0' }}>Рабочее место охранника</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ 
            fontSize: '15px', 
            color: isDarkMode ? '#a3a3a3' : '#64748b', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px' 
          }}>
            <Clock size={18} />
            Смена: {workStart} — {workEnd}
          </div>

          {/* Кнопка смены темы */}
          <button 
            onClick={toggleTheme} 
            style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: isDarkMode ? '#f59e0b' : '#64748b' }}
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>

          {/* Кнопка Настройки */}
          <button 
            onClick={() => setShowSettings(true)} 
            style={{ 
              padding: '10px 18px', 
              backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9', 
              color: isDarkMode ? 'white' : '#0f172a',
              border: isDarkMode ? 'none' : '1px solid #e4e4e7',
              borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              fontWeight: 500
            }}
          >
            <Settings size={20} color="#eab308" /> Настройки
          </button>

          {/* Кнопка Профиль */}
          <button 
            onClick={() => setShowProfile(true)} 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9', 
              color: isDarkMode ? 'white' : '#0f172a',
              border: isDarkMode ? 'none' : '1px solid #e4e4e7',
              borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              fontWeight: 500
            }}
          >
            <UserCheck size={22} color="#3b82f6" /> Профиль
          </button>

          {/* Кнопка Выйти */}
          <button 
            onClick={onLogout} 
            style={{ 
              padding: '10px 18px', 
              backgroundColor: isDarkMode ? '#27272a' : '#fef2f2', 
              color: '#f43f5e',
              border: isDarkMode ? 'none' : '1px solid #fee2e2',
              borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              fontWeight: 500
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      {/* Основной контент: Списки заявок */}
      <main style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        
        {/* Колонки заявок: На вход */}
        <div>
          <h2 style={{ fontSize: '28px', color: '#10b981', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ArrowRight size={28} /> На вход ({inRequests.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {inRequests.map(req => (
              <div key={req.id} style={{ 
                backgroundColor: isDarkMode ? '#18181b' : '#ffffff', 
                borderRadius: '24px', 
                padding: '24px', 
                border: '1px solid ' + (isDarkMode ? '#10b981' : '#a7f3d0'),
                boxShadow: isDarkMode ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '32px', fontFamily: 'monospace', color: '#10b981' }}>{req.code}</div>
                    <h3 style={{ fontSize: '22px', margin: '8px 0 4px', color: isDarkMode ? 'white' : '#0f172a' }}>
                      {req.user?.fullName || req.fullName || 'Неизвестный сотрудник'}
                    </h3>
                    <p style={{ color: isDarkMode ? '#a3a3a3' : '#64748b', margin: 0 }}>
                      {req.user?.position || req.position || ''}
                    </p>
                  </div>
                  <span style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>ВХОД</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#a3a3a3', marginBottom: '6px' }}>Архив</div>
                    <img 
                      src={req.archivePhotoUrl || 'https://placeholder.com'} 
                      style={{ width: '100%', height: '500px', objectFit: 'cover', borderRadius: '16px', backgroundColor: '#27272a' }} 
                      onError={(e) => e.currentTarget.src = 'https://placeholder.com'}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#a3a3a3', marginBottom: '6px' }}>Селфи</div>
                    <img 
                      src={req.selfieUrl} 
                      style={{ width: '100%', height: '500px', objectFit: 'cover', borderRadius: '16px', backgroundColor: '#27272a' }} 
                      onError={(e) => e.currentTarget.src = 'https://placeholder.com'}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <button onClick={() => handlePass(req.id, req.user?.fullName || req.fullName || 'Сотрудник')} 
                    style={{ backgroundColor: '#10b981', color: 'white', padding: '16px', borderRadius: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                    <CheckCircle size={20} /> Пропустить
                  </button>
                  <button onClick={() => handleReject(req.id, req.user?.fullName || req.fullName || 'Сотрудник')} 
                    style={{ backgroundColor: '#f43f5e', color: 'white', padding: '16px', borderRadius: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                    <XCircle size={20} /> Задержать
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Колонки заявок: На выход */}
        <div>
          <h2 style={{ fontSize: '28px', color: '#f59e0b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ArrowRight size={28} style={{ transform: 'rotate(180deg)' }} /> На выход ({outRequests.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {outRequests.map(req => (
              <div key={req.id} style={{ 
                backgroundColor: isDarkMode ? '#18181b' : '#ffffff', 
                borderRadius: '24px', 
                padding: '24px', 
                border: '1px solid ' + (isDarkMode ? '#f59e0b' : '#fde68a'),
                boxShadow: isDarkMode ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '32px', fontFamily: 'monospace', color: '#f59e0b' }}>{req.code}</div>
                    <h3 style={{ fontSize: '22px', margin: '8px 0 4px', color: isDarkMode ? 'white' : '#0f172a' }}>
                      {req.user?.fullName || req.fullName || 'Неизвестный сотрудник'}
                    </h3>
                    <p style={{ color: isDarkMode ? '#a3a3a3' : '#64748b', margin: 0 }}>
                      {req.user?.position || req.position || ''}
                    </p>
                  </div>
                  <span style={{ color: '#f59e0b', fontSize: '20px', fontWeight: 'bold' }}>ВЫХОД</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#a3a3a3', marginBottom: '6px' }}>Архив</div>
                    <img 
                      src={req.archivePhotoUrl || 'https://placeholder.com'} 
                      style={{ width: '100%', height: '500px', objectFit: 'cover', borderRadius: '16px', backgroundColor: '#27272a' }} 
                      onError={(e) => e.currentTarget.src = 'https://placeholder.com'}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#a3a3a3', marginBottom: '6px' }}>Селфи</div>
                    <img 
                      src={req.selfieUrl} 
                      style={{ width: '100%', height: '500px', objectFit: 'cover', borderRadius: '16px', backgroundColor: '#27272a' }} 
                      onError={(e) => e.currentTarget.src = 'https://placeholder.com'}
                    />
                  </div>
                </div>


                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <button onClick={() => handlePass(req.id, req.user?.fullName || req.fullName || 'Сотрудник')} 
                    style={{ backgroundColor: '#f59e0b', color: 'white', padding: '16px', borderRadius: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                    <CheckCircle size={20} /> Пропустить
                  </button>
                  <button onClick={() => handleReject(req.id, req.user?.fullName || req.fullName || 'Сотрудник')} 
                    style={{ backgroundColor: '#f43f5e', color: 'white', padding: '16px', borderRadius: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                    <XCircle size={20} /> Задержать
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Модальные окна с пробросом флага темы */}
      {showSettings && (
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
          isDarkMode={isDarkMode} 
        />
      )}
      
      {showProfile && (
        <ProfileModal 
          isOpen={showProfile} 
          onClose={() => setShowProfile(false)} 
          isDarkMode={isDarkMode} 
        />
      )}
    </div>
  );
};

export default MainScreen;