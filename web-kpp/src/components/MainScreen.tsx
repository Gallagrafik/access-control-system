import { useState, useEffect } from 'react';
import { UserCheck, ArrowRight, ArrowLeft, CheckCircle, XCircle, Settings, Clock, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';

interface AccessRequest {
  id: string;
  code: string;
  fullName?: string;
  user?: {
    fullName: string;
    position?: string;
  };
  position?: string;
  requestType: 'IN' | 'OUT';
  selfieUrl: string;
  archivePhotoUrl: string | null;
}

interface MainScreenProps {
  userFullName: string;
  onLogout: () => void;
}

function MainScreen({ userFullName, onLogout }: MainScreenProps) {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("18:00");

  // === ИСПРАВЛЕНИЕ URL ===
  const fixUrl = (url?: string | null): string => {
    if (!url) return 'https://via.placeholder.com/400x500/4F46E5/FFFFFF?text=Селфи';
    return url.replace('localhost', '192.168.0.101');
  };

  const processedRequests = requests.map(req => ({
    ...req,
    selfieUrl: fixUrl(req.selfieUrl),
    archivePhotoUrl: fixUrl(req.archivePhotoUrl),
  }));

  const filteredRequests = processedRequests.filter(req => 
    searchCode === '' || req.code.startsWith(searchCode)
  );

  const inRequests = filteredRequests.filter(r => r.requestType === 'IN');
  const outRequests = filteredRequests.filter(r => r.requestType === 'OUT');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/access-request/active');
        if (response.ok) {
          const data = await response.json();
          setRequests(data);
        }
      } catch (e) {
        console.error('Ошибка сети:', e);
      }
    };

    fetchRequests();
    const interval = setInterval(fetchRequests, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/settings/schedule');
        if (res.data) {
          setWorkStart(res.data.startTime || "09:00");
          setWorkEnd(res.data.endTime || "18:00");
        }
      } catch (e) {
        console.log('Не удалось загрузить расписание');
      }
    };
    loadSchedule();
  }, []);

  const handlePass = async (id: string, name: string) => {
    try {
      await fetch(`http://localhost:3000/api/access-request/process/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const handleReject = async (id: string, name: string) => {
    try {
      await fetch(`http://localhost:3000/api/access-request/process/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT' }),
      });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div style={{ backgroundColor: isDarkMode ? '#09090b' : '#f8fafc', color: isDarkMode ? 'white' : '#0f172a', minHeight: '100vh', fontFamily: 'system-ui' }}>
      {/* Шапка */}
      <header style={{ backgroundColor: isDarkMode ? '#18181b' : '#ffffff', borderBottom: '1px solid #27272a', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <UserCheck size={40} color="#3b82f6" />
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>КПП • Контроль доступа</h1>
            <p style={{ color: isDarkMode ? '#a3a3a3' : '#64748b' }}>Рабочее место охранника</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ fontSize: '15px', color: isDarkMode ? '#a3a3a3' : '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} />
            {workStart} — {workEnd}
          </div>

          <button onClick={toggleTheme} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>

          <button onClick={() => setShowSettings(true)} style={{ padding: '10px 18px', backgroundColor: '#27272a', border: '1px solid #eab308', borderRadius: '12px', color: 'white', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} /> Настройки
          </button>

          <button onClick={() => setShowProfile(true)} style={{ padding: '10px 20px', backgroundColor: '#27272a', border: '1px solid #3b82f6', borderRadius: '12px', color: 'white', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={22} /> Профиль
          </button>

          <button onClick={onLogout} style={{ padding: '10px 18px', backgroundColor: '#27272a', border: '1px solid #ef4444', borderRadius: '12px', color: 'white', fontSize: '16px', cursor: 'pointer' }}>
            Выйти
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px' }}>
        <div style={{ backgroundColor: isDarkMode ? '#18181b' : '#f1f5f9', padding: '20px 32px', borderRadius: '20px', marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
          <input
            type="text"
            maxLength={4}
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.replace(/\D/g, ''))}
            style={{ width: '320px', fontSize: '48px', textAlign: 'center', padding: '12px 16px', borderRadius: '16px', border: '2px solid #3b82f6', backgroundColor: isDarkMode ? '#27272a' : '#f8fafc', color: isDarkMode ? 'white' : '#0f172a', outline: 'none', fontFamily: 'monospace' }}
            placeholder="7842"
            autoFocus
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          {/* На вход */}
          <div>
            <h2 style={{ fontSize: '28px', color: '#10b981', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ArrowRight size={28} /> На вход ({inRequests.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {inRequests.map(req => (
                <div key={req.id} style={{ backgroundColor: isDarkMode ? '#18181b' : '#ffffff', borderRadius: '24px', padding: '24px', border: '1px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                      <div style={{ fontSize: '32px', fontFamily: 'monospace', color: '#10b981' }}>{req.code}</div>
                      <h3 style={{ fontSize: '22px', margin: '8px 0 4px', color: isDarkMode ? 'white' : '#0f172a' }}>
                        {req.user?.fullName || req.fullName || 'Неизвестный сотрудник'}
                      </h3>
                      <p style={{ color: isDarkMode ? '#a3a3a3' : '#64748b' }}>
                        {req.user?.position || req.position || ''}
                      </p>
                    </div>
                    <span style={{ color: '#10b981', fontSize: '20px' }}>ВХОД</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: '#a3a3a3', marginBottom: '6px' }}>Архив</div>
                      <img 
                        src={req.archivePhotoUrl || 'https://via.placeholder.com/400x500/1E40AF/FFFFFF?text=Архив'} 
                        style={{ width: '100%', borderRadius: '16px', backgroundColor: '#27272a' }} 
                        onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/400x500/1E40AF/FFFFFF?text=Архив'}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#a3a3a3', marginBottom: '6px' }}>Селфи</div>
                      <img 
                        src={req.selfieUrl} 
                        style={{ width: '100%', borderRadius: '16px', backgroundColor: '#27272a' }} 
                        onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/400x500/4F46E5/FFFFFF?text=Селфи+не+загружено'}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <button onClick={() => handlePass(req.id, req.user?.fullName || req.fullName || 'Сотрудник')} 
                      style={{ backgroundColor: '#10b981', color: 'white', padding: '16px', borderRadius: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <CheckCircle size={20} /> Пропустить
                    </button>
                    <button onClick={() => handleReject(req.id, req.user?.fullName || req.fullName || 'Сотрудник')} 
                      style={{ backgroundColor: '#f43f5e', color: 'white', padding: '16px', borderRadius: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <XCircle size={20} /> Задержать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* На выход */}
          <div>
            <h2 style={{ fontSize: '28px', color: '#f59e0b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
              На выход ({outRequests.length}) <ArrowLeft size={28} />
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {outRequests.map(req => (
                <div key={req.id} style={{ backgroundColor: isDarkMode ? '#18181b' : '#ffffff', borderRadius: '24px', padding: '24px', border: '1px solid #f59e0b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                      <div style={{ fontSize: '32px', fontFamily: 'monospace', color: '#f59e0b' }}>{req.code}</div>
                      <h3 style={{ fontSize: '22px', margin: '8px 0 4px', color: isDarkMode ? 'white' : '#0f172a' }}>
                        {req.user?.fullName || req.fullName || 'Неизвестный сотрудник'}
                      </h3>
                      <p style={{ color: isDarkMode ? '#a3a3a3' : '#64748b' }}>
                        {req.user?.position || req.position || ''}
                      </p>
                    </div>
                    <span style={{ color: '#f59e0b', fontSize: '20px' }}>ВЫХОД</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: '#a3a3a3', marginBottom: '6px' }}>Архив</div>
                      <img 
                        src={req.archivePhotoUrl || 'https://via.placeholder.com/400x500/1E40AF/FFFFFF?text=Архив'} 
                        style={{ width: '100%', borderRadius: '16px', backgroundColor: '#27272a' }} 
                        onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/400x500/1E40AF/FFFFFF?text=Архив'}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#a3a3a3', marginBottom: '6px' }}>Селфи</div>
                      <img 
                        src={req.selfieUrl} 
                        style={{ width: '100%', borderRadius: '16px', backgroundColor: '#27272a' }} 
                        onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/400x500/4F46E5/FFFFFF?text=Селфи+не+загружено'}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <button onClick={() => handlePass(req.id, req.user?.fullName || req.fullName || 'Сотрудник')} 
                      style={{ backgroundColor: '#10b981', color: 'white', padding: '16px', borderRadius: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <CheckCircle size={20} /> Пропустить
                    </button>
                    <button onClick={() => handleReject(req.id, req.user?.fullName || req.fullName || 'Сотрудник')} 
                      style={{ backgroundColor: '#f43f5e', color: 'white', padding: '16px', borderRadius: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <XCircle size={20} /> Задержать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showProfile && <ProfileModal userFullName={userFullName} onClose={() => setShowProfile(false)} />}
      {showSettings && (
        <SettingsModal 
          workStart={workStart} 
          workEnd={workEnd} 
          onSave={(newStart, newEnd) => {
            setWorkStart(newStart);
            setWorkEnd(newEnd);
            alert('Настройки сохранены');
          }} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
}

export default MainScreen;