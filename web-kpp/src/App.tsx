import { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import MainScreen from './components/MainScreen';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [userFullName, setUserFullName] = useState('');

  const handleLoginSuccess = (newToken: string, fullName: string) => {
    setToken(newToken);
    setUserFullName(fullName);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken('');
    setUserFullName('');
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return <MainScreen userFullName={userFullName} onLogout={handleLogout} />;
}

export default App;