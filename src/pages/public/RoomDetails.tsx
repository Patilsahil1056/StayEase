import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Wifi, Wind, Coffee, Sparkles, BedDouble, Shield, ArrowLeft } from 'lucide-react';
import { formatCurrency, calculateNights } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../api/supabaseClient';
import type { Room } from '../../types/database';

const RoomDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '2');

  // Set default dates if none passed
  useEffect(() => {
    if (!checkIn) {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 2);
      setCheckIn(today.toISOString().split('T')[0]);
      setCheckOut(tomorrow.toISOString().split('T')[0]);
    }
  }, [checkIn]);

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      try {
        if (id) {
          const { data, error } = await supabase
            .from('rooms')
            .select('*, room_type:room_types(*)')
            .eq('id', id)
            .single();

          if (!error && data) {
            setRoom(data as Room);
          }
        }
      } catch (err) {
        console.error('Error fetching room details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id]);

  const nights = calculateNights(checkIn, checkOut) || 1;
  const pricePerNight = room?.price_per_night || 6500;
  const subtotal = pricePerNight * nights;
  const taxes = Math.round(subtotal * 0.12);
  const total = subtotal + taxes;

  const handleBookNow = () => {
    const checkoutUrl = `/checkout?roomId=${room?.id || id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(checkoutUrl)}`);
    } else {
      navigate(checkoutUrl);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#B8924A] border-t-transparent rounded-full mx-auto" />
        <p className="text-xs uppercase tracking-wider text-[#B8924A] mt-3">Consulting Chamber Records...</p>
      </div>
    );
  }

  const roomTitle = room?.title || 'The Victoria Heritage Chamber';
  const roomNumber = room?.room_number || '101';
  const roomImage = room?.images?.[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80';
  const roomDesc = room?.description || 'Restored colonial chamber featuring mahogany woodwork and Egyptian cotton linens.';

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-xs uppercase tracking-wider text-[#5B1A1F] hover:text-[#782329]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Collection</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-3">
            <span className="label-caps text-[#B8924A]">
              {room?.room_type?.name || 'HERITAGE SUITE'} · CHAMBER {roomNumber}
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#1C1410]">{roomTitle}</h1>
            <p className="text-xs text-[#1C1410]/70">
              {room?.size_sqft || 450} sq.ft · Courtyard & Estate Views · {room?.beds || 1} Bed · Max {room?.capacity || 2} Guests
            </p>
          </div>

          <div className="overflow-hidden arched-frame border border-[#B8924A]/40 h-[420px] bg-black/10">
            <img
              src={roomImage}
              alt={roomTitle}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-[#B8924A]/30">
            <h3 className="font-serif text-2xl text-[#1C1410]">Chamber Chronicle</h3>
            <p className="text-sm text-[#1C1410]/80 leading-relaxed font-light">
              {roomDesc}
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#B8924A]/30">
            <h3 className="font-serif text-2xl text-[#1C1410]">Chamber Appointments & Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-[#1C1410]">
              <div className="flex items-center space-x-2.5 p-3 rounded bg-[#EADFC8] border border-[#B8924A]/20">
                <Wifi className="w-4 h-4 text-[#B8924A]" />
                <span>Complimentary Fibre Wi-Fi</span>
              </div>
              <div className="flex items-center space-x-2.5 p-3 rounded bg-[#EADFC8] border border-[#B8924A]/20">
                <Coffee className="w-4 h-4 text-[#B8924A]" />
                <span>Artisan French Press & Teas</span>
              </div>
              <div className="flex items-center space-x-2.5 p-3 rounded bg-[#EADFC8] border border-[#B8924A]/20">
                <Wind className="w-4 h-4 text-[#B8924A]" />
                <span>Whisper-Quiet Climate Control</span>
              </div>
              <div className="flex items-center space-x-2.5 p-3 rounded bg-[#EADFC8] border border-[#B8924A]/20">
                <Sparkles className="w-4 h-4 text-[#B8924A]" />
                <span>24/7 Dedicated Concierge</span>
              </div>
              <div className="flex items-center space-x-2.5 p-3 rounded bg-[#EADFC8] border border-[#B8924A]/20">
                <BedDouble className="w-4 h-4 text-[#B8924A]" />
                <span>Fine Egyptian Linens & Pillow Menu</span>
              </div>
              <div className="flex items-center space-x-2.5 p-3 rounded bg-[#EADFC8] border border-[#B8924A]/20">
                <Shield className="w-4 h-4 text-[#B8924A]" />
                <span>In-Chamber Private Safe & Gourmet Bar</span>
              </div>
            </div>
            
            {/* Highlights banner */}
            <div className="p-4 rounded bg-[#0F2A24]/10 border border-[#0F2A24]/20 flex items-center justify-between text-xs text-[#0F2A24]">
              <div className="flex items-center space-x-2 font-medium">
                <Sparkles className="w-4 h-4 text-[#B8924A]" />
                <span>Heritage Guarantee: Complimentary high tea & evening chamber turndown service included.</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="sticky top-28 bg-[#0F2A24] text-[#F6EFE2] rounded-lg p-6 border-gold-hairline space-y-6 shadow-2xl">
            <div>
              <span className="label-caps text-[#D9BC82]">RESERVATION SUMMARY</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="font-serif text-3xl font-bold text-[#F6EFE2] lining-nums">
                  {formatCurrency(pricePerNight)}
                </span>
                <span className="text-xs text-[#CFC6B4]">/ night</span>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#B8924A]/30">
              <div>
                <label className="label-caps text-[#D9BC82] block mb-1">Check-In</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-black/40 border border-[#B8924A]/40 rounded-[3px] text-[#F6EFE2] px-3 py-2 text-sm focus:outline-none focus:border-[#D9BC82]"
                />
              </div>

              <div>
                <label className="label-caps text-[#D9BC82] block mb-1">Check-Out</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-black/40 border border-[#B8924A]/40 rounded-[3px] text-[#F6EFE2] px-3 py-2 text-sm focus:outline-none focus:border-[#D9BC82]"
                />
              </div>

              <div>
                <label className="label-caps text-[#D9BC82] block mb-1">Guests</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full bg-[#0F2A24] border border-[#B8924A]/40 rounded-[3px] text-[#F6EFE2] px-3 py-2 text-sm focus:outline-none focus:border-[#D9BC82]"
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4 Guests</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-[#B8924A]/25 text-xs text-[#CFC6B4]">
              <div className="flex justify-between">
                <span>{formatCurrency(pricePerNight)} × {nights} nights</span>
                <span className="text-[#F6EFE2] font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Heritage Luxury Tax & GST (12%)</span>
                <span className="text-[#F6EFE2] font-medium">{formatCurrency(taxes)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-[#B8924A]/25 text-sm text-[#F6EFE2] font-bold">
                <span>Total Amount</span>
                <span className="font-serif text-lg text-[#D9BC82]">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              onClick={handleBookNow}
              className="w-full bg-[#5B1A1F] hover:bg-[#782329] text-[#F6EFE2] py-3 rounded-[3px] border border-[#B8924A]/50 font-medium label-caps tracking-[0.2em] transition shadow-lg text-center block cursor-pointer"
            >
              Reserve Chamber
            </button>

            <p className="text-[11px] text-center text-[#CFC6B4]/80">
              Guaranteed double-booking protection enforced by database exclusion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;
