import React, { useState, useEffect } from 'react';

interface AccessRequest {
  id: string;
  code: string;
  requestType: 'IN' | 'OUT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  processedAt?: string | null;
  archivePhotoUrl?: string | null;
  selfieUrl?: string | null;
  user?: {
    id: string;
    fullName: string;
    passportNumber: string;
    position: string | null;
    department: string | null;
    archivePhotoUrl?: string | null;
    isActive: boolean;
  };
}

interface AccessLog {
  id: string;
  userId: string | null;
  requestId: string | null;
  action: 'PASS' | 'REJECT' | 'CREATE_REQUEST' | 'LOGIN' | 'LOGOUT' | 'EXPIRE';
  timestamp: string;
  request?: AccessRequest | null;
}

interface AccessLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  initialFilter?: string;
  initialStartDate?: string;
  initialEndDate?: string;
}

const formatLogTime = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatFullDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

export const AccessLogsModal: React.FC<AccessLogsModalProps> = ({ 
  isOpen, 
  onClose, 
  isDarkMode, 
  initialFilter = 'ALL',
  initialStartDate = '',
  initialEndDate = ''
}) => {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>(initialStartDate);
  const [endDate, setEndDate] = useState<string>(initialEndDate);
  const [searchName, setSearchName] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

  // Загрузка логов при открытии
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      fetch('http://localhost:3000/api/access-logs')
        .then(res => {
          if (!res.ok) throw new Error(`Status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          setLogs(Array.isArray(data) ? data : []);
        })
        .catch(err => {
          console.error(err);
          setError(err.message || 'Error');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Синхронизация пропсов с состоянием при открытии
  useEffect(() => {
    if (isOpen) {
      setStatusFilter(initialFilter);
      setStartDate(initialStartDate);
      setEndDate(initialEndDate);
      setTypeFilter('ALL');
      setSearchName('');
    }
  }, [isOpen, initialFilter, initialStartDate, initialEndDate]);

  if (!isOpen) return null;

  // ГРУППИРУЕМ ЛОГИ ПО requestId, оставляем только последний по времени для каждой заявки
  const uniqueLogsMap = new Map<string, AccessLog>();
  
  logs.forEach(log => {
    if (!log.requestId) return;
    
    const existing = uniqueLogsMap.get(log.requestId);
    if (!existing || new Date(log.timestamp) > new Date(existing.timestamp)) {
      uniqueLogsMap.set(log.requestId, log);
    }
  });
  
  const uniqueLogs = Array.from(uniqueLogsMap.values());

  // Фильтрация уникальных логов
  const filteredLogs = uniqueLogs.filter(log => {
    const reqData = log.request;
    const fullName = (reqData?.user?.fullName || 'Системное событие').toLowerCase();
    
    if (searchName && !fullName.includes(searchName.toLowerCase().trim())) return false;
    if (statusFilter !== 'ALL' && reqData?.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && reqData?.requestType !== typeFilter) return false;
    
    if (startDate) {
      const startDateMs = new Date(startDate).getTime();
      const logTimestamp = new Date(log.timestamp).getTime();
      if (logTimestamp < startDateMs) return false;
    }
    if (endDate) {
      const endDateMs = new Date(endDate).getTime();
      const logTimestamp = new Date(log.timestamp).getTime();
      if (logTimestamp > endDateMs) return false;
    }
    return true;
  });

  const theme = {
    bg: isDarkMode ? '#18181b' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#0f172a',
    textMuted: isDarkMode ? '#a1a1aa' : '#64748b',
    border: isDarkMode ? '#27272a' : '#e4e4e7',
    rowBorder: isDarkMode ? '#27272a' : '#f1f5f9',
    selectBg: isDarkMode ? '#27272a' : '#f1f5f9',
    subBg: isDarkMode ? '#1f1f23' : '#f8fafc',
    imgPlaceholder: isDarkMode ? '#27272a' : '#e2e8f0',
  };

  const getArchivePhotoUrl = (request: AccessRequest): string | null => {
    return request.archivePhotoUrl || request.user?.archivePhotoUrl || null;
  };

  const handleImageError = (type: string, id: string) => {
    setImageErrors(prev => ({ ...prev, [`${type}_${id}`]: true }));
    console.error(`Failed to load ${type} image for request ${id}`);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', text: 'Принято' };
      case 'REJECTED':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', text: 'Отклонено' };
      case 'EXPIRED':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', text: 'Просрочено' };
      case 'ENTERED_WITHOUT_EXIT':
        return { bg: 'rgba(139, 92, 246, 0.15)', color: '#a855f7', text: 'Вошёл без выхода' };
      case 'INCIDENT':
        return { bg: 'rgba(185, 28, 28, 0.15)', color: '#b91c1c', text: 'Инцидент' };
      default:
        return { bg: 'transparent', color: theme.textMuted, text: '—' };
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: theme.bg, color: theme.text, width: '1000px', height: '680px', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', border: `1px solid ${theme.border}`, position: 'relative' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>История заявок</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '28px', cursor: 'pointer' }}>&times;</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', padding: '12px', borderRadius: '12px', backgroundColor: theme.subBg, marginBottom: '20px', border: `1px solid ${theme.border}`, flexShrink: 0 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 200px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: theme.textMuted }}>ФИО:</label>
            <input 
              type="text" 
              placeholder="Поиск сотрудника..." 
              value={searchName} 
              onChange={(e) => setSearchName(e.target.value)} 
              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', backgroundColor: theme.selectBg, color: theme.text, border: `1px solid ${theme.border}`, outline: 'none', fontSize: '13px' }} 
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: theme.textMuted }}>Статус:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: theme.selectBg, color: theme.text, border: `1px solid ${theme.border}`, fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}>
              <option value="ALL">Все</option>
              <option value="APPROVED">Принято</option>
              <option value="REJECTED">Отклонено</option>
              <option value="EXPIRED">Просрочено</option>
              <option value="ENTERED_WITHOUT_EXIT">Вошёл без выхода</option>
              <option value="INCIDENT">Инцидент</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: theme.textMuted }}>Тип:</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: theme.selectBg, color: theme.text, border: `1px solid ${theme.border}`, fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}>
              <option value="ALL">Все</option>
              <option value="IN">Вход</option>
              <option value="OUT">Выход</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: theme.textMuted }}>С:</label>
            <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '5px 8px', borderRadius: '6px', backgroundColor: theme.selectBg, color: theme.text, border: `1px solid ${theme.border}`, outline: 'none', colorScheme: isDarkMode ? 'dark' : 'light' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: theme.textMuted }}>По:</label>
            <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '5px 8px', borderRadius: '6px', backgroundColor: theme.selectBg, color: theme.text, border: `1px solid ${theme.border}`, outline: 'none', colorScheme: isDarkMode ? 'dark' : 'light' }} />
          </div>

          {(startDate || endDate || statusFilter !== 'ALL' || typeFilter !== 'ALL' || searchName) && (
            <button onClick={() => { 
              setStartDate(''); 
              setEndDate(''); 
              setStatusFilter('ALL'); 
              setTypeFilter('ALL');
              setSearchName(''); 
            }} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#ef4444', color: 'white', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              Очистить
            </button>
          )}
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
          {loading && <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted, fontSize: '18px' }}>Загрузка логов...</div>}
          {error && <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}><p style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>Ошибка соединения</p><p style={{ fontSize: '14px', margin: 0 }}>{error}</p></div>}
          {!loading && !error && filteredLogs.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>Заявки не найдены</div>}
          
          {!loading && !error && filteredLogs.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.border}`, color: theme.textMuted, fontSize: '14px' }}>
                  <th style={{ padding: '12px 8px' }}>Дата и время</th>
                  <th style={{ padding: '12px 8px' }}>Сотрудник / Код</th>
                  <th style={{ padding: '12px 8px' }}>Статус</th>
                  <th style={{ padding: '12px 8px' }}>Тип</th>
                  <th style={{ padding: '12px 8px' }}>Создана в</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const reqData = log.request;
                  const fullName = reqData?.user?.fullName || 'Системное событие';
                  const code = reqData?.code ? ` [${reqData.code}]` : '';
                  const statusStyle = getStatusStyle(reqData?.status || '');
                  return (
                    <tr key={log.id} onClick={() => reqData && setSelectedRequest(reqData)} style={{ borderBottom: `1px solid ${theme.rowBorder}`, cursor: reqData ? 'pointer' : 'default' }} onMouseEnter={(e) => reqData && (e.currentTarget.style.backgroundColor = isDarkMode ? '#27272a' : '#f8fafc')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td style={{ padding: '14px 8px', fontFamily: 'monospace' }}>{formatFullDate(log.timestamp)} в {formatLogTime(log.timestamp)}</td>
                      <td style={{ padding: '14px 8px', fontWeight: '500' }}>{fullName}<span style={{ color: '#10b981', fontFamily: 'monospace' }}>{code}</span>{reqData && <span style={{ fontSize: '11px', display: 'block', color: theme.textMuted, fontWeight: 'normal' }}>Нажмите для фото</span>}</td>
                      <td style={{ padding: '14px 8px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                          {statusStyle.text}
                        </span>
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', backgroundColor: reqData?.requestType === 'IN' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: reqData?.requestType === 'IN' ? '#10b981' : '#f59e0b' }}>
                          {reqData?.requestType === 'IN' ? 'Вход' : 'Выход'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 8px', fontFamily: 'monospace', color: theme.textMuted }}>{reqData?.createdAt ? formatLogTime(reqData.createdAt) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selectedRequest && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
            <div style={{ backgroundColor: theme.subBg, color: theme.text, padding: '25px', borderRadius: '20px', width: '540px', border: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Фотографии по заявке #{selectedRequest.code}</h3>
                <button onClick={() => setSelectedRequest(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: theme.textMuted, textAlign: 'center' }}>Архивное фото</p>
                  {(() => {
                    const archivePhotoUrl = getArchivePhotoUrl(selectedRequest);
                    const errorKey = `archive_${selectedRequest.id}`;
                    
                    if (archivePhotoUrl && !imageErrors[errorKey]) {
                      return (
                        <img 
                          src={archivePhotoUrl} 
                          alt="Архив" 
                          style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '12px', border: `1px solid ${theme.border}` }}
                          onError={() => handleImageError('archive', selectedRequest.id)}
                        />
                      );
                    } else {
                      return (
                        <div style={{ width: '100%', aspectRatio: '3/4', backgroundColor: theme.imgPlaceholder, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, flexDirection: 'column', gap: '8px' }}>
                          <span>📷</span>
                          <span style={{ fontSize: '12px' }}>Нет фото</span>
                        </div>
                      );
                    }
                  })()}
                </div>

                <div>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: theme.textMuted, textAlign: 'center' }}>Селфи с КПП</p>
                  {(() => {
                    const errorKey = `selfie_${selectedRequest.id}`;
                    
                    if (selectedRequest.selfieUrl && !imageErrors[errorKey]) {
                      return (
                        <img 
                          src={selectedRequest.selfieUrl} 
                          alt="Селфи" 
                          style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '12px', border: `1px solid ${theme.border}` }}
                          onError={() => handleImageError('selfie', selectedRequest.id)}
                        />
                      );
                    } else {
                      return (
                        <div style={{ width: '100%', aspectRatio: '3/4', backgroundColor: theme.imgPlaceholder, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, flexDirection: 'column', gap: '8px' }}>
                          <span>📸</span>
                          <span style={{ fontSize: '12px' }}>Нет селфи</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '18px' }}>
                  {selectedRequest.user?.fullName || 'Системное событие'}
                </p>
                <p style={{ color: theme.textMuted, margin: '0 0 12px 0', fontSize: '14px' }}>
                  {selectedRequest.user?.position || ''}
                </p>
                
                {selectedRequest.user?.passportNumber && (
                  <span style={{ 
                    display: 'inline-block',
                    padding: '4px 10px', 
                    borderRadius: '6px', 
                    fontSize: '13px', 
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9',
                    color: isDarkMode ? '#e4e4e7' : '#334155',
                    border: `1px solid ${theme.border}`
                  }}>
                    Паспорт: {selectedRequest.user.passportNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};