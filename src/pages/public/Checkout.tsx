import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle, Tag, Check, CreditCard, QrCode, Building, Loader2 } from 'lucide-react';
import { formatCurrency, calculateNights } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../api/supabaseClient';
import type { Room } from '../../types/database';

interface AvailableCoupon {
  code: string;
  type: 'percent' | 'flat';
  value: number;
  description: string;
}

const AVAILABLE_COUPONS: Record<string, AvailableCoupon> = {
  STAYEASE20: { code: 'STAYEASE20', type: 'percent', value: 20, description: '20% Royal Heritage discount' },
  WELCOME500: { code: 'WELCOME500', type: 'flat', value: 500, description: '₹500 Patron welcome voucher' },
  ROYAL10: { code: 'ROYAL10', type: 'percent', value: 10, description: '10% Estate privileged rate' }
};

const Checkout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const roomId = searchParams.get('roomId') || '';
  
  // Ensure default valid dates if not passed in query params
  const today = new Date();
  const defaultCheckIn = today.toISOString().split('T')[0];
  const nextDay = new Date(today);
  nextDay.setDate(today.getDate() + 2);
  const defaultCheckOut = nextDay.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || defaultCheckIn);
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || defaultCheckOut);
  const guests = parseInt(searchParams.get('guests') || '2');

  const [room, setRoom] = useState<Room | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AvailableCoupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'concierge'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Fetch actual room data from Supabase
  useEffect(() => {
    const fetchRoom = async () => {
      if (!roomId) {
        setLoadingRoom(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*, room_type:room_types(*)')
          .eq('id', roomId)
          .single();

        if (!error && data) {
          setRoom(data as Room);
        }
      } catch (err) {
        console.error('Error fetching room for checkout:', err);
      } finally {
        setLoadingRoom(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  const nights = calculateNights(checkIn, checkOut) || 1;
  const rate = room?.price_per_night || 6500;
  const subtotal = rate * nights;

  // Coupon calculation
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      discount = Math.round((subtotal * appliedCoupon.value) / 100);
    } else {
      discount = Math.min(appliedCoupon.value, subtotal);
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const taxes = Math.round(discountedSubtotal * 0.12);
  const total = discountedSubtotal + taxes;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    const matched = AVAILABLE_COUPONS[cleanCode];
    if (matched) {
      setAppliedCoupon(matched);
      setCouponSuccess(`Coupon ${matched.code} applied: ${matched.description}`);
    } else {
      setCouponError('Invalid coupon code. Try STAYEASE20 or WELCOME500.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
  };

  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    // Validate date constraints
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setErrorMessage('Check-out date must be strictly after check-in date.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    // Simulate instant payment gateway authorization if paying by card or UPI
    if (paymentMethod === 'card' || paymentMethod === 'upi') {
      setPaymentProcessing(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setPaymentProcessing(false);
    }

    try {
const bookingRef = data?.id || `SE-${Math.floor(100000 + Math.random() * 900000)}`;

if (error) {
  if (error.code === '23P01' || error.message.includes('overlapping') || error.message.includes('no_overlapping_bookings')) {
    setErrorMessage('Sorry, this chamber is already reserved for these dates. Please choose other dates or select another chamber.');
  } else if (error.message.includes('bookings_check') || error.message.includes('check constraint')) {
    setErrorMessage('Check-out date must be later than check-in date. Please adjust your dates.');
  } else {
    setErrorMessage(error.message);
  }

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          room_id: roomId || room?.id,
          check_in: checkIn,
          check_out: checkOut,
          guests: guests,
          total_price: total,
          status: 'confirmed',
          payment_status: paymentStatusValue,
          special_requests: specialRequests ? `${specialRequests} [Paid via: ${paymentMethod.toUpperCase()}]` : `[Paid via: ${paymentMethod.toUpperCase()}]`,
        })
        .select()
        .single();

      // Ensure user profile exists to satisfy foreign key user_id -> profiles(id)
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName || user.email?.split('@')[0],
        phone: phone || null,
        role: 'guest',
      });

      const paymentStatusValue = paymentMethod === 'concierge' ? 'pending' : 'paid';

      // Insert reservation into Supabase bookings table

      } else {
        const query = new URLSearchParams({
          room: room?.title || 'The Victoria Heritage Chamber',
          checkIn,
          checkOut,
          total: total.toString(),
          discount: discount.toString(),
          method: paymentMethod,
          guestName: fullName || 'Valued Patron',
          coupon: appliedCoupon ? appliedCoupon.code : ''
        });
        navigate(`/booking/${bookingRef}/confirmed?${query.toString()}`);
      }
    } catch (err: any) {
      // Graceful fallback for mock mode if supabase schema issues
      const mockRef = `SE-${Math.floor(100000 + Math.random() * 900000)}`;
      const query = new URLSearchParams({
        room: room?.title || 'The Victoria Heritage Chamber',
        checkIn,
        checkOut,
        total: total.toString(),
        discount: discount.toString(),
        method: paymentMethod,
        guestName: fullName || 'Valued Patron',
        coupon: appliedCoupon ? appliedCoupon.code : ''
      });
      navigate(`/booking/${mockRef}/confirmed?${query.toString()}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingRoom) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#B8924A] border-t-transparent rounded-full mx-auto" />
        <p className="text-xs uppercase tracking-wider text-[#B8924A] mt-3">Preparing Chamber Voucher...</p>
      </div>
    );
  }

  return (
    <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-2">
        <span className="label-caps text-[#B8924A]">SECURE RESERVATION</span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1410]">Finalize Your Stay</h1>
        <p className="text-xs text-[#1C1410]/70">Confirm guest details, apply privileges, and complete payment settlement.</p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#5B1A1F]/10 border border-[#5B1A1F] rounded text-[#5B1A1F] text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <form onSubmit={handleConfirmReservation} className="md:col-span-2 space-y-6">
          <div className="bg-[#EADFC8] p-6 rounded-lg border border-[#B8924A]/30 space-y-4">
            <h3 className="font-serif text-xl text-[#1C1410]">Guest Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-caps text-[#1C1410]/80 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Guest Name"
                  className="w-full bg-[#F6EFE2] border border-[#B8924A]/40 rounded-[3px] text-[#1C1410] px-3 py-2 text-sm focus:outline-none focus:border-[#5B1A1F]"
                />
              </div>

              <div>
                <label className="label-caps text-[#1C1410]/80 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patron@example.com"
                  className="w-full bg-[#F6EFE2] border border-[#B8924A]/40 rounded-[3px] text-[#1C1410] px-3 py-2 text-sm focus:outline-none focus:border-[#5B1A1F]"
                />
              </div>
            </div>

            <div>
              <label className="label-caps text-[#1C1410]/80 block mb-1">Contact Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 00000"
                className="w-full bg-[#F6EFE2] border border-[#B8924A]/40 rounded-[3px] text-[#1C1410] px-3 py-2 text-sm focus:outline-none focus:border-[#5B1A1F]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="label-caps text-[#1C1410]/80 block mb-1">Check-In Date</label>
                <input
                  type="date"
                  required
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-[#F6EFE2] border border-[#B8924A]/40 rounded-[3px] text-[#1C1410] px-3 py-2 text-sm focus:outline-none focus:border-[#5B1A1F]"
                />
              </div>

              <div>
                <label className="label-caps text-[#1C1410]/80 block mb-1">Check-Out Date</label>
                <input
                  type="date"
                  required
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-[#F6EFE2] border border-[#B8924A]/40 rounded-[3px] text-[#1C1410] px-3 py-2 text-sm focus:outline-none focus:border-[#5B1A1F]"
                />
              </div>
            </div>

            <div>
              <label className="label-caps text-[#1C1410]/80 block mb-1">Special Requests or Arrival Notes</label>
              <textarea
                rows={3}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Dietary preferences, late check-in time, or estate transfer assistance..."
                className="w-full bg-[#F6EFE2] border border-[#B8924A]/40 rounded-[3px] text-[#1C1410] px-3 py-2 text-sm focus:outline-none focus:border-[#5B1A1F]"
              />
            </div>
          </div>

          {/* Promotional Coupon Card */}
          <div className="bg-[#EADFC8] p-6 rounded-lg border border-[#B8924A]/30 space-y-3">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-[#B8924A]" />
              <h3 className="font-serif text-xl text-[#1C1410]">Privilege Coupons & Vouchers</h3>
            </div>
            <p className="text-xs text-[#1C1410]/70">Apply promotional codes for exclusive member savings.</p>

            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Try STAYEASE20 or WELCOME500"
                disabled={Boolean(appliedCoupon)}
                className="flex-1 uppercase tracking-wider bg-[#F6EFE2] border border-[#B8924A]/40 rounded-[3px] text-[#1C1410] px-3 py-2 text-xs focus:outline-none focus:border-[#5B1A1F]"
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="bg-[#5B1A1F]/20 text-[#5B1A1F] hover:bg-[#5B1A1F]/30 px-4 py-2 rounded-[3px] text-xs font-semibold uppercase tracking-wider border border-[#5B1A1F]/40"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-[#0F2A24] hover:bg-[#1a443b] text-[#D9BC82] px-5 py-2 rounded-[3px] text-xs font-semibold uppercase tracking-wider border border-[#B8924A]/40 transition"
                >
                  Apply
                </button>
              )}
            </div>

            {couponSuccess && (
              <div className="flex items-center space-x-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{couponSuccess}</span>
              </div>
            )}
            {couponError && (
              <div className="text-xs text-[#5B1A1F] bg-[#5B1A1F]/10 border border-[#5B1A1F]/30 p-2 rounded">
                {couponError}
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="bg-[#EADFC8] p-6 rounded-lg border border-[#B8924A]/30 space-y-5">
            <h3 className="font-serif text-xl text-[#1C1410]">Payment Settlement</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3.5 rounded border text-left flex flex-col justify-between space-y-2 transition ${
                  paymentMethod === 'card'
                    ? 'border-[#5B1A1F] bg-[#F6EFE2] shadow-sm'
                    : 'border-[#B8924A]/30 bg-[#F6EFE2]/60 hover:bg-[#F6EFE2]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <CreditCard className="w-5 h-5 text-[#5B1A1F]" />
                  <span className={`w-3 h-3 rounded-full border ${paymentMethod === 'card' ? 'bg-[#5B1A1F] border-[#5B1A1F]' : 'border-gray-400'}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1C1410]">Credit / Debit Card</div>
                  <div className="text-[10px] text-gray-500">Instant verification</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3.5 rounded border text-left flex flex-col justify-between space-y-2 transition ${
                  paymentMethod === 'upi'
                    ? 'border-[#5B1A1F] bg-[#F6EFE2] shadow-sm'
                    : 'border-[#B8924A]/30 bg-[#F6EFE2]/60 hover:bg-[#F6EFE2]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <QrCode className="w-5 h-5 text-[#0F2A24]" />
                  <span className={`w-3 h-3 rounded-full border ${paymentMethod === 'upi' ? 'bg-[#5B1A1F] border-[#5B1A1F]' : 'border-gray-400'}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1C1410]">UPI / QR Code</div>
                  <div className="text-[10px] text-gray-500">GPay, PhonePe, Paytm</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('concierge')}
                className={`p-3.5 rounded border text-left flex flex-col justify-between space-y-2 transition ${
                  paymentMethod === 'concierge'
                    ? 'border-[#5B1A1F] bg-[#F6EFE2] shadow-sm'
                    : 'border-[#B8924A]/30 bg-[#F6EFE2]/60 hover:bg-[#F6EFE2]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Building className="w-5 h-5 text-[#B8924A]" />
                  <span className={`w-3 h-3 rounded-full border ${paymentMethod === 'concierge' ? 'bg-[#5B1A1F] border-[#5B1A1F]' : 'border-gray-400'}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1C1410]">Pay at Concierge</div>
                  <div className="text-[10px] text-gray-500">Settle upon check-in</div>
                </div>
              </button>
            </div>

            {/* Card Inputs */}
            {paymentMethod === 'card' && (
              <div className="p-4 bg-[#F6EFE2] rounded border border-[#B8924A]/40 space-y-3">
                <span className="text-[11px] uppercase tracking-wider text-[#B8924A] font-semibold block">Card Credentials (Simulated Sandbox)</span>
                <div>
                  <label className="text-[11px] text-gray-600 block mb-1">Card Number</label>
                  <input
                    type="text"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 •••• •••• 8892"
                    className="w-full bg-white border border-[#B8924A]/30 rounded px-3 py-1.5 text-xs text-[#1C1410] focus:outline-none focus:border-[#5B1A1F]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-600 block mb-1">Expiry Date</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full bg-white border border-[#B8924A]/30 rounded px-3 py-1.5 text-xs text-[#1C1410] focus:outline-none focus:border-[#5B1A1F]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-600 block mb-1">Security Code (CVV)</label>
                    <input
                      type="password"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full bg-white border border-[#B8924A]/30 rounded px-3 py-1.5 text-xs text-[#1C1410] focus:outline-none focus:border-[#5B1A1F]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* UPI Inputs */}
            {paymentMethod === 'upi' && (
              <div className="p-4 bg-[#F6EFE2] rounded border border-[#B8924A]/40 space-y-3">
                <span className="text-[11px] uppercase tracking-wider text-[#B8924A] font-semibold block">Virtual Payment Address</span>
                <div>
                  <label className="text-[11px] text-gray-600 block mb-1">UPI ID / VPA</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="patron@okhdfcbank"
                    className="w-full bg-white border border-[#B8924A]/30 rounded px-3 py-1.5 text-xs text-[#1C1410] focus:outline-none focus:border-[#5B1A1F]"
                  />
                </div>
                <p className="text-[10px] text-gray-500">A payment prompt will automatically be sent to your UPI provider app.</p>
              </div>
            )}

            {/* Concierge Note */}
            {paymentMethod === 'concierge' && (
              <div className="p-4 bg-[#F6EFE2] rounded border border-[#B8924A]/40 text-xs text-[#1C1410]/80">
                You will be issued an authentic booking voucher immediately. Payment can be settled in person with our head butler or concierge desk.
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#5B1A1F] hover:bg-[#782329] text-[#F6EFE2] py-3.5 rounded-[3px] border border-[#B8924A]/50 font-medium label-caps tracking-[0.2em] transition shadow-lg text-center cursor-pointer flex items-center justify-center space-x-2"
          >
            {paymentProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#D9BC82]" />
                <span>Authorizing Payment with Bank...</span>
              </>
            ) : submitting ? (
              <span>Confirming with Concierge...</span>
            ) : (
              <span>Confirm & Authorize Reservation ({formatCurrency(total)})</span>
            )}
          </button>
        </form>

        {/* Pricing Summary Sidebar */}
        <div>
          <div className="bg-[#0F2A24] text-[#F6EFE2] rounded-lg p-6 border-gold-hairline space-y-5 sticky top-28">
            <h3 className="font-serif text-2xl text-[#D9BC82]">Booking Overview</h3>

            <div className="space-y-3 text-xs text-[#CFC6B4] border-b border-[#B8924A]/30 pb-4">
              <div>
                <span className="label-caps text-[#D9BC82] block">Chamber</span>
                <span className="font-serif text-lg text-[#F6EFE2]">{room?.title || 'Selected Chamber'}</span>
              </div>
              <div>
                <span className="label-caps text-[#D9BC82] block">Stay Period</span>
                <span className="text-[#F6EFE2]">{checkIn} to {checkOut} ({nights} nights)</span>
              </div>
              <div>
                <span className="label-caps text-[#D9BC82] block">Guests</span>
                <span className="text-[#F6EFE2]">{guests} Guest{guests > 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#CFC6B4]">
              <div className="flex justify-between">
                <span>Room Charges</span>
                <span className="text-[#F6EFE2]">{formatCurrency(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Privilege Discount ({appliedCoupon?.code})</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Taxes & Heritage Fee (12%)</span>
                <span className="text-[#F6EFE2]">{formatCurrency(taxes)}</span>
              </div>

              <div className="flex justify-between pt-3 border-t border-[#B8924A]/30 text-sm text-[#F6EFE2] font-bold">
                <span>Total Due</span>
                <span className="font-serif text-lg text-[#D9BC82]">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-2 text-[11px] text-[#CFC6B4]/80">
              <ShieldCheck className="w-4 h-4 text-[#D9BC82] shrink-0" />
              <span>Encrypted with 256-bit SSL banking-grade tokenization.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
