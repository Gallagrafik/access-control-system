import { useState } from 'react';
import axios from 'axios';

interface LoginScreenProps {
  onLoginSuccess: (token: string, fullName: string) => void;
}

function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      alert('Введите логин и пароль');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://10.75.148.69:3000/api/guard/login', {
        username,
        password,
      });

      const token = res.data.access_token;
      const fullName = res.data.guard.fullName;

      onLoginSuccess(token, fullName);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0A0A0A', 
      color: 'white', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{ 
        width: '380px', 
        backgroundColor: '#1F1F1F', 
        padding: '40px', 
        borderRadius: '20px' 
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Вход для охранника</h1>
        
        <input
          type="text"
          placeholder="Логин"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: '100%', padding: '14px', marginBottom: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#2A2A2A', color: 'white', fontSize: '16px' }}
        />
        
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '14px', marginBottom: '25px', borderRadius: '10px', border: 'none', backgroundColor: '#2A2A2A', color: 'white', fontSize: '16px' }}
        />

        <button 
          onClick={handleLogin}
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '16px', 
            fontSize: '18px', 
            backgroundColor: loading ? '#4b5563' : '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '10px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#888', fontSize: '14px' }}>
          Тестовый аккаунт: <strong>admin</strong> / <strong>admin123</strong>
        </p>
      </div>
    </div>
  );
}

export default LoginScreen;