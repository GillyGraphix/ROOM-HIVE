import { useState } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EventsAndSubscriptions from './components/EventsAndSubscriptions';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Kama hajafanya login, muonyeshe ukurasa wa Login tu
  if (!isLoggedIn) {
    return <Login onLogin={setIsLoggedIn} />;
  }

  // Akishafanya login, muonyeshe mfumo mzima
  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-100 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'subscriptions' && <EventsAndSubscriptions />}
      </main>
    </div>
  );
}