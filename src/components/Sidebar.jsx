import { useState } from 'react';

export default function Sidebar({ activeTab, setActiveTab, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setIsOpen(false); // Close mobile menu automatically when a tab is selected
  };

  return (
    <>
      {/* Mobile Top Navigation Bar with Hamburger Menu on the Left */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-2xl focus:outline-none p-1 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
            aria-label="Toggle Menu"
          >
            ☰
          </button>
          <div className="text-xl font-black tracking-wider flex items-center" style={{ color: '#1c78b9' }}>
            RoomHive
            <span className="text-[9px] px-1.5 py-0.5 rounded ml-1.5 text-white font-bold tracking-widest" style={{ backgroundColor: '#1c78b9' }}>
              PRO
            </span>
          </div>
        </div>
      </div>

      {/* Backdrop Overlay for Mobile when Sidebar is Open */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col justify-between p-6 shadow-2xl border-r border-slate-800
        transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:min-h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo & Close Button for Mobile */}
          <div className="flex items-center justify-between mb-8 md:block">
            <div className="text-2xl font-black tracking-wider flex items-center" style={{ color: '#1c78b9' }}>
              RoomHive
              <span className="text-[10px] px-2 py-0.5 rounded ml-2 text-white font-bold tracking-widest" style={{ backgroundColor: '#1c78b9' }}>
                PRO
              </span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="md:hidden text-slate-400 hover:text-white text-xl font-bold p-1 rounded focus:outline-none"
            >
              ✕
            </button>
          </div>

          <nav className="space-y-3">
            <button 
              onClick={() => handleTabClick('dashboard')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-3 ${activeTab === 'dashboard' ? 'text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              style={activeTab === 'dashboard' ? { backgroundColor: '#1c78b9' } : {}}
            >
              <span className="text-lg"></span> Dashboard & Bookings
            </button>
            
            <button 
              onClick={() => handleTabClick('subscriptions')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-3 ${activeTab === 'subscriptions' ? 'text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              style={activeTab === 'subscriptions' ? { backgroundColor: '#1c78b9' } : {}}
            >
              <span className="text-lg"></span> Events & Subscriptions
            </button>
          </nav>
        </div>
        
        <div className="pt-6 border-t border-slate-800">
          <button 
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full py-2.5 px-4 font-bold rounded-lg transition-all text-center"
            style={{ color: '#e34027', backgroundColor: 'rgba(227, 64, 39, 0.1)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e34027'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(227, 64, 39, 0.1)'; e.currentTarget.style.color = '#e34027'; }}
          >
            Secure Logout
          </button>
        </div>
      </aside>
    </>
  );
}