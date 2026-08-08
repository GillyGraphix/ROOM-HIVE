import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2';

export default function EventsAndSubscriptions() {
  const [items, setItems] = useState([]);

  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('Event');
  const [endDate, setEndDate] = useState('');
  const [cost, setCost] = useState('');

  // Notification Toggle State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Fetch Events & Subscriptions from Supabase on component load
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase.from('events_subscriptions').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching items from Supabase:', error);
    } else {
      // Map Supabase columns to match component state variables
      const formattedItems = (data || []).map(i => ({
        id: i.id,
        type: i.type,
        name: i.name,
        startDate: i.start_date,
        endDate: i.end_date,
        cost: i.cost
      }));
      setItems(formattedItems);
    }
  };

  // Function to play a soft notification chime
  const playNotificationSound = () => {
    if (!notificationsEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (error) {
      console.log('Audio playback prevented or unsupported', error);
    }
  };

  const formatToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Add New Item/Event to Supabase
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if (!itemName || !endDate) {
      Swal.fire({ 
        icon: 'warning', 
        title: 'Missing Info', 
        text: 'Please fill in the Title and Target Date.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#18365c'
      });
      return;
    }

    const todayDate = new Date().toISOString().split('T')[0];

    const newItemPayload = {
      id: Date.now(),
      type: itemType,
      name: itemName,
      start_date: todayDate,
      end_date: endDate,
      cost: cost || 'Free / Not Specified'
    };

    const { error } = await supabase.from('events_subscriptions').insert([newItemPayload]);

    if (error) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Database Error', 
        text: error.message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#e34027' 
      });
      return;
    }

    fetchItems();
    setItemName('');
    setEndDate('');
    setCost('');
    setItemType('Event');

    playNotificationSound();

    Swal.fire({
      icon: 'success',
      title: 'Reminder Saved',
      text: 'Your event or subscription has been saved successfully.',
      showConfirmButton: true,
      confirmButtonText: 'OK',
      confirmButtonColor: '#1c78b9'
    });
  };

  const handleDeleteItem = (id) => {
    Swal.fire({
      title: 'Delete Record?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e34027',
      cancelButtonColor: '#18365c',
      confirmButtonText: 'Yes, Delete!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { error } = await supabase.from('events_subscriptions').delete().eq('id', id);
        if (error) {
          Swal.fire({ 
            icon: 'error', 
            title: 'Error', 
            text: error.message,
            confirmButtonText: 'OK',
            confirmButtonColor: '#e34027' 
          });
          return;
        }
        fetchItems();
        Swal.fire({
          title: 'Deleted!',
          text: 'The record has been removed.',
          icon: 'success',
          confirmButtonColor: '#1c78b9',
          confirmButtonText: 'OK'
        });
      }
    });
  };

  const getDaysRemaining = (endDateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDateString);
    end.setHours(0, 0, 0, 0);
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const upcomingAlerts = items.filter((item) => {
    const days = getDaysRemaining(item.endDate);
    return days >= 0 && days <= 4;
  });

  const getStatusBadge = (endDateString) => {
    const daysLeft = getDaysRemaining(endDateString);

    if (daysLeft > 4) {
      return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full shadow-sm">Active ({daysLeft} Days Left)</span>;
    } else if (daysLeft >= 1 && daysLeft <= 4) {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full shadow-sm animate-pulse">⚠️ Prep Early: {daysLeft} Days Left</span>;
    } else if (daysLeft === 0) {
      return <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full shadow-sm animate-bounce">🚨 Due Today!</span>;
    } else {
      return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full shadow-sm">❌ Passed / Expired</span>;
    }
  };

  return (
    <div className="p-6 md:p-10 flex-1 bg-slate-50 overflow-y-auto min-h-screen">
      
      {/* HEADER & NOTIFICATION TOGGLE */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#18365c' }}>Events & Subscriptions Calendar</h1>
          <p className="text-slate-500 text-sm">Smart hospitality advance reminders synced with Supabase cloud.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 shadow-inner">
          <span className="text-xs font-bold text-slate-700">
            Notifications: {notificationsEnabled ? <span className="text-green-600">ENABLED</span> : <span className="text-red-600">DISABLED</span>}
          </span>
          <button 
            onClick={() => {
              const newState = !notificationsEnabled;
              setNotificationsEnabled(newState);
              if (newState) playNotificationSound();
            }}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none shadow-sm ${notificationsEnabled ? 'bg-green-600' : 'bg-slate-400'}`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* ADVANCE NOTICE BANNER */}
      {upcomingAlerts.length > 0 && notificationsEnabled && (
        <div className="p-6 rounded-2xl shadow-lg mb-8 text-white border-l-4 border-yellow-400" style={{ backgroundColor: '#18365c' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔔</span>
              <h2 className="text-base font-bold text-yellow-400">Advance Notice Alert (Action Required in Next 4 Days)</h2>
            </div>
            <button 
              onClick={playNotificationSound}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg border border-white/20 transition-all font-semibold"
            >
              🔊 Test Sound
            </button>
          </div>
          <p className="text-xs text-slate-300 mb-4">Upcoming events or bills requiring your preparation soon:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingAlerts.map((alertItem) => {
              const days = getDaysRemaining(alertItem.endDate);
              return (
                <div key={alertItem.id} className="bg-white/10 p-4 rounded-xl border border-white/15 flex flex-col justify-between shadow-sm backdrop-blur-sm">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded text-white font-bold uppercase tracking-wider shadow-sm" style={{ backgroundColor: '#1c78b9' }}>
                      {alertItem.type}
                    </span>
                    <h3 className="font-semibold text-sm mt-2 text-white">{alertItem.name}</h3>
                  </div>
                  <div className="mt-4 text-xs text-yellow-300 font-bold flex justify-between items-center border-t border-white/10 pt-2">
                    <span>Date: {formatToDDMMYYYY(alertItem.endDate)}</span>
                    <span className="bg-yellow-400 text-slate-900 px-2 py-0.5 rounded-full font-extrabold">
                      {days === 0 ? 'Today!' : `${days} day(s) left`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NEW RECORD FORM */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 transition-all hover:shadow-md">
        <h2 className="text-lg font-bold mb-4 border-b pb-2" style={{ color: '#18365c' }}>Schedule New Event or Bill</h2>
        <form onSubmit={handleAddItem}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Title / Description</label>
              <input 
                type="text" 
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
                placeholder="e.g., VIP Guest Birthday, Domain Renewal"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none text-sm bg-slate-50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Category</label>
              <select 
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none text-sm bg-slate-50 transition-all"
              >
                <option value="Event">Office Event</option>
                <option value="Birthday">Birthday Reminder</option>
                <option value="Subscription">Subscription / Bill</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Cost (Optional)</label>
              <input 
                type="text" 
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="e.g., Tsh 50,000"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none text-sm bg-slate-50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Target Date</label>
              <input 
                type="date" 
                min="2026-01-01"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-2 py-2 border rounded-lg focus:outline-none text-xs bg-slate-50 transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              type="submit"
              className="px-8 py-2.5 text-white font-bold rounded-lg transition-all text-sm shadow-md hover:opacity-95"
              style={{ backgroundColor: '#1c78b9' }}
            >
              Save Reminder
            </button>
          </div>
        </form>
      </div>

      {/* SCHEDULE TABLE */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#18365c' }}>All Scheduled Reminders</h2>
          <div className="px-3 py-1 rounded-md text-xs font-bold" style={{ backgroundColor: '#e8f0fe', color: '#1c78b9' }}>
            Total Items: {items.length}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b-2 text-xs font-bold text-slate-500 uppercase bg-slate-50">
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Cost</th>
                <th className="p-4">Target Date</th>
                <th className="p-4 text-center">Status & Countdown</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm text-slate-700">
              {items.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 italic">No reminders found in database.</td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-semibold text-slate-800">{item.name}</td>
                  <td className="p-4">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                      {item.type}
                    </span>
                  </td>
                  <td className="p-4 font-medium" style={{ color: '#18365c' }}>{item.cost}</td>
                  <td className="p-4 font-medium text-slate-800">{formatToDDMMYYYY(item.endDate)}</td>
                  <td className="p-4 text-center">
                    {getStatusBadge(item.endDate)}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="px-4 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm"
                      style={{ color: '#e34027', backgroundColor: '#fdf2f2', border: '1px solid #fde8e8' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e34027'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fdf2f2'; e.currentTarget.style.color = '#e34027'; }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}