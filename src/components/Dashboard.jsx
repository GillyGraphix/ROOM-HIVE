import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2'; 

export default function Dashboard() {
  const TOTAL_ROOMS = {
    'Double Room': 6,
    'Family Room': 3,
    'Triple Room': 1
  };

  const [bookings, setBookings] = useState([]);

  // Form States
  const [guestName, setGuestName] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  const [roomType, setRoomType] = useState('Double Room');
  const [roomsCount, setRoomsCount] = useState(1);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const [filterDate, setFilterDate] = useState('2026-08-07');
  const [availableRooms, setAvailableRooms] = useState(TOTAL_ROOMS);

  // Notification Toggle State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Fetch Bookings from Supabase on component load
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching bookings from Supabase:', error);
    } else {
      // Map Supabase column names to match the variables used in your JSX
      const formattedBookings = (data || []).map(b => ({
        id: b.id,
        guest: b.guest,
        guestsCount: b.guests_count,
        roomType: b.room_type,
        roomsCount: b.rooms_count,
        checkIn: b.check_in,
        checkOut: b.check_out,
        status: b.status
      }));
      setBookings(formattedBookings);
    }
  };

  // Function to play a soft notification chime using Web Audio API
  const playNotificationSound = () => {
    if (!notificationsEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5 note
      
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

  // Formatting date for display (DD/MM/YYYY)
  const formatToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Inventory Logic (Calculating available rooms)
  useEffect(() => {
    let occupied = { 'Double Room': 0, 'Family Room': 0, 'Triple Room': 0 };

    bookings.forEach((booking) => {
      if (filterDate >= booking.checkIn && filterDate < booking.checkOut) {
        occupied[booking.roomType] += Number(booking.roomsCount);
      }
    });

    setAvailableRooms({
      'Double Room': TOTAL_ROOMS['Double Room'] - occupied['Double Room'],
      'Family Room': TOTAL_ROOMS['Family Room'] - occupied['Family Room'],
      'Triple Room': TOTAL_ROOMS['Triple Room'] - occupied['Triple Room'],
    });

    // Check if any booking checks out today or soon and play chime if enabled
    const hasUrgentCheckouts = bookings.some((booking) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(booking.checkOut);
      end.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
      return diffDays === 0;
    });

    if (hasUrgentCheckouts && notificationsEnabled) {
      playNotificationSound();
    }
  }, [filterDate, bookings, notificationsEnabled]);

  const handleCheckInChange = (e) => {
    setCheckIn(e.target.value);
    setFilterDate(e.target.value);
  };

  // Add New Booking to Supabase
  const handleAddBooking = async (e) => {
    e.preventDefault();
    if (!guestName || !checkIn || !checkOut || roomsCount < 1 || guestsCount < 1) return;

    if (new Date(checkIn) >= new Date(checkOut)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Date',
        text: 'Check-out date must be strictly after the Check-In date.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#18365c'
      });
      return;
    }

    if (availableRooms[roomType] < roomsCount) {
      Swal.fire({
        icon: 'warning',
        title: 'Insufficient Rooms!',
        text: `For ${formatToDDMMYYYY(filterDate)}, only ${availableRooms[roomType]} ${roomType}(s) are currently available.`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#18365c'
      });
      return;
    }

    const newBookingPayload = {
      id: Date.now(),
      guest: guestName,
      guests_count: Number(guestsCount),
      room_type: roomType,
      rooms_count: Number(roomsCount),
      check_in: checkIn,
      check_out: checkOut,
      status: 'Confirmed'
    };

    const { error } = await supabase.from('bookings').insert([newBookingPayload]);

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

    fetchBookings();
    
    // Clear form
    setGuestName('');
    setGuestsCount(1);
    setRoomsCount(1);
    setCheckIn('');
    setCheckOut('');

    playNotificationSound();

    Swal.fire({
      icon: 'success',
      title: 'Booking Confirmed',
      text: 'The guest has been successfully saved',
      showConfirmButton: true,
      confirmButtonText: 'OK',
      confirmButtonColor: '#1c78b9'
    });
  };

  // Delete Booking from Supabase
  const handleDeleteBooking = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this action!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e34027', 
      cancelButtonColor: '#18365c', 
      confirmButtonText: 'Yes, Delete!',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { error } = await supabase.from('bookings').delete().eq('id', id);
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
        fetchBookings();
        Swal.fire({
          title: 'Deleted!',
          text: 'The booking has been completely removed.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#1c78b9'
        });
      }
    });
  };

  // Adjust Stay Duration (+ / -) in Supabase
  const handleUpdateDays = async (id, delta) => {
    const targetBooking = bookings.find(b => b.id === id);
    if (!targetBooking) return;

    const currentOutDate = new Date(targetBooking.checkOut);
    const inDate = new Date(targetBooking.checkIn);
    
    currentOutDate.setDate(currentOutDate.getDate() + delta);
    
    if (currentOutDate <= inDate) {
      Swal.fire({
        icon: 'error',
        title: 'Action Denied',
        text: 'Days cannot be reduced further. Check-out must remain ahead of Check-In.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e34027'
      });
      return;
    }

    const yyyy = currentOutDate.getFullYear();
    const mm = String(currentOutDate.getMonth() + 1).padStart(2, '0');
    const dd = String(currentOutDate.getDate()).padStart(2, '0');
    const newCheckOut = `${yyyy}-${mm}-${dd}`;

    const { error } = await supabase.from('bookings').update({ check_out: newCheckOut }).eq('id', id);
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
    fetchBookings();
  };

  // Calculate Nights
  const calculateNights = (inDate, outDate) => {
    const start = new Date(inDate);
    const end = new Date(outDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  // Calculate Days Remaining Status
  const getDaysRemainingBadge = (outDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(outDate);
    end.setHours(0, 0, 0, 0);

    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full shadow-sm">{diffDays} Days Left</span>;
    } else if (diffDays === 0) {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full shadow-sm animate-pulse">Checkout Today</span>;
    } else {
      return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full shadow-sm">Overdue</span>;
    }
  };

  return (
    <div className="p-6 md:p-10 flex-1 bg-slate-50 overflow-y-auto min-h-screen">
      
      {/* HEADER & NOTIFICATION TOGGLE */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#18365c' }}>Hotel Dashboard & Bookings</h1>
          <p className="text-slate-500 text-sm">Manage room inventory and guest reservations seamlessly.</p>
        </div>
        
        {/* Enable / Disable Notification Toggle Switch */}
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

      {/* AVAILABILITY CHECKER */}
      <div className="p-6 rounded-2xl shadow-md mb-8 text-white transition-all" style={{ backgroundColor: '#18365c' }}>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div>
            <h2 className="text-lg font-bold mb-1">Room Availability Overview</h2>
            <p className="text-slate-300 text-sm mb-4">Select a date to preview available inventory</p>
            <input 
              type="date" 
              min="2026-01-01"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 bg-white/20 border border-white/30 text-white [color-scheme:dark] shadow-sm"
              style={{ focusRingColor: '#1c78b9' }}
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/10 p-4 rounded-xl border border-white/20 text-center min-w-[120px] hover:bg-white/20 transition-all">
              <div className="text-xs text-slate-300 uppercase tracking-wider mb-1">Double</div>
              <div className="text-2xl font-bold" style={{ color: '#1c78b9' }}>
                {availableRooms['Double Room']} <span className="text-lg text-slate-400">/ {TOTAL_ROOMS['Double Room']}</span>
              </div>
            </div>
            <div className="bg-white/10 p-4 rounded-xl border border-white/20 text-center min-w-[120px] hover:bg-white/20 transition-all">
              <div className="text-xs text-slate-300 uppercase tracking-wider mb-1">Family</div>
              <div className="text-2xl font-bold" style={{ color: '#1c78b9' }}>
                {availableRooms['Family Room']} <span className="text-lg text-slate-400">/ {TOTAL_ROOMS['Family Room']}</span>
              </div>
            </div>
            <div className="bg-white/10 p-4 rounded-xl border border-white/20 text-center min-w-[120px] hover:bg-white/20 transition-all">
              <div className="text-xs text-slate-300 uppercase tracking-wider mb-1">Triple</div>
              <div className="text-2xl font-bold" style={{ color: '#1c78b9' }}>
                {availableRooms['Triple Room']} <span className="text-lg text-slate-400">/ {TOTAL_ROOMS['Triple Room']}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW BOOKING FORM */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 transition-all hover:shadow-md">
        <h2 className="text-lg font-bold mb-4 border-b pb-2" style={{ color: '#18365c' }}>Create New Booking</h2>
        <form onSubmit={handleAddBooking}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Guest Full Name</label>
              <input 
                type="text" 
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                placeholder="Enter guest name"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 text-sm bg-slate-50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Total Guests</label>
              <input 
                type="number" 
                min="1"
                value={guestsCount}
                onChange={(e) => setGuestsCount(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 text-sm bg-slate-50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Room Type</label>
              <select 
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 text-sm bg-slate-50 transition-all"
              >
                <option value="Double Room">Double Room</option>
                <option value="Family Room">Family Room</option>
                <option value="Triple Room">Triple Room</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Rooms Needed</label>
              <input 
                type="number" 
                min="1"
                value={roomsCount}
                onChange={(e) => setRoomsCount(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 text-sm bg-slate-50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Check-In</label>
              <input 
                type="date" 
                min="2026-01-01"
                value={checkIn}
                onChange={handleCheckInChange}
                required
                className="w-full px-2 py-2 border rounded-lg focus:outline-none focus:ring-1 text-xs bg-slate-50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase">Check-Out</label>
              <input 
                type="date" 
                min="2026-01-01"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                className="w-full px-2 py-2 border rounded-lg focus:outline-none focus:ring-1 text-xs bg-slate-50 transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              type="submit"
              className="px-8 py-2.5 text-white font-bold rounded-lg transition-all text-sm shadow-md hover:shadow-lg hover:opacity-90"
              style={{ backgroundColor: '#1c78b9' }}
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </div>

      {/* ACTIVE BOOKINGS TABLE */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#18365c' }}>Active Bookings List</h2>
          <div className="px-3 py-1 rounded-md text-xs font-bold" style={{ backgroundColor: '#e8f0fe', color: '#1c78b9' }}>
            Total Records: {bookings.length}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b-2 text-xs font-bold text-slate-500 uppercase bg-slate-50">
                <th className="p-4">Guest Name</th>
                <th className="p-4 text-center">Guests</th>
                <th className="p-4">Room Type</th>
                <th className="p-4 text-center">Rooms</th>
                <th className="p-4">Check-In</th>
                <th className="p-4">Check-Out</th>
                <th className="p-4 text-center">Nights (Adjust)</th>
                <th className="p-4 text-center">Action</th>
                <th className="p-4 text-right">Time Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm text-slate-700">
              {bookings.length === 0 && (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-500 italic">No active bookings available in the system.</td>
                </tr>
              )}
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-semibold text-slate-800">{booking.guest}</td>
                  <td className="p-4 text-center font-bold text-slate-600">{booking.guestsCount}</td>
                  <td className="p-4">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                      {booking.roomType}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold" style={{ color: '#18365c' }}>{booking.roomsCount}</td>
                  
                  <td className="p-4 font-medium text-slate-600">{formatToDDMMYYYY(booking.checkIn)}</td>
                  <td className="p-4 font-medium" style={{ color: '#e34027' }}>{formatToDDMMYYYY(booking.checkOut)}</td>
                  
                  {/* +/- Controls for Stay Duration */}
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleUpdateDays(booking.id, -1)}
                        className="w-7 h-7 rounded flex items-center justify-center font-bold bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors shadow-sm"
                        title="Reduce Days"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 rounded-full text-xs font-bold min-w-[75px] text-center shadow-sm" style={{ backgroundColor: '#e8f0fe', color: '#1c78b9' }}>
                        {calculateNights(booking.checkIn, booking.checkOut)} Days
                      </span>
                      <button 
                        onClick={() => handleUpdateDays(booking.id, 1)}
                        className="w-7 h-7 rounded flex items-center justify-center font-bold text-white hover:opacity-80 transition-colors shadow-sm"
                        style={{ backgroundColor: '#1c78b9' }}
                        title="Add Days"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="px-4 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm"
                      style={{ color: '#e34027', backgroundColor: '#fdf2f2', border: '1px solid #fde8e8' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e34027'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fdf2f2'; e.currentTarget.style.color = '#e34027'; }}
                    >
                      Delete
                    </button>
                  </td>

                  {/* Days Remaining Column (End) */}
                  <td className="p-4 text-right">
                    {getDaysRemainingBadge(booking.checkOut)}
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