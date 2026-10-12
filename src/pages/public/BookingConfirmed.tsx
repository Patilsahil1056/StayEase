import React from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Printer, Sparkles, HeartHandshake, ShieldCheck, CreditCard, Building } from 'lucide-react';
import { formatCurrency } from '../../lib/format';

const BookingConfirmed: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const room = searchParams.get('room') || 'The Victoria Heritage Chamber';
  const checkIn = searchParams.get('checkIn') || '2026-11-01';
  const checkOut = searchParams.get('checkOut') || '2026-11-04';
  const total = Number(searchParams.get('total')) || 14560;
  const discount = Number(searchParams.get('discount')) || 0;
  const method = searchParams.get('method') || 'card';
  const guestName = searchParams.get('guestName') || 'Valued Patron';
  const coupon = searchParams.get('coupon') || '';

  const getMethodBadge = () => {
    if (method === 'card') {
      return (
        <span className="inline-flex items-center space-x-1 text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 font-medium">
          <CreditCard className="w-3.5 h-3.5" />
          <span>Paid via Credit Card</span>
        </span>
      );
    }
    if (method === 'upi') {
      return (
        <span className="inline-flex items-center space-x-1 text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Paid via UPI Transfer</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 text-xs text-[#5B1A1F] bg-[#5B1A1F]/10 px-2 py-0.5 rounded border border-[#5B1A1F]/30 font-medium">
        <Building className="w-3.5 h-3.5" />
        <span>Pay at Concierge</span>
      </span>
    );
  };

  return (
    <div className="py-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="bg-[#EADFC8] p-8 sm:p-12 rounded-lg border border-[#B8924A]/40 text-center space-y-6 shadow-xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-[#0F2A24] text-[#D9BC82] mx-auto flex items-center justify-center border border-[#B8924A]">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="label-caps text-[#B8924A]">RESERVATION CONFIRMED</span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1410]">We Look Forward to Welcoming You</h1>
          <p className="text-xs text-[#1C1410]/70">
            Booking Reference: <span className="font-mono font-bold text-[#5B1A1F]">{id || 'SE-89104'}</span>
          </p>
        </div>

        {/* Personalized Welcome Note */}
        <div className="bg-[#F6EFE2] rounded-lg p-6 border border-[#B8924A]/40 text-left space-y-3 relative overflow-hidden">
          <div className="flex items-center space-x-2 text-[#5B1A1F]">
            <HeartHandshake className="w-5 h-5 text-[#B8924A]" />
            <h4 className="font-serif text-lg font-semibold">A Personal Welcome from Our Head Concierge</h4>
          </div>
          <p className="text-xs text-[#1C1410]/80 leading-relaxed italic">
            "Dear {guestName}, it is our deepest privilege to host you at StayEase. Your chamber has been reserved with utmost care, and our estate staff will prepare your personalized arrival refreshments, bespoke pillow selection, and evening turndown. Should you have any bespoke requests prior to your arrival, our concierge remains at your complete disposal."
          </p>
          <div className="pt-2 border-t border-[#B8924A]/20 flex items-center justify-between text-[11px] text-[#1C1410]/70">
            <span className="font-medium text-[#5B1A1F]">— Jonathan Sterling, General Manager & Chief Steward</span>
            <span className="flex items-center space-x-1 text-[#B8924A]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Complimentary High Tea Awaits</span>
            </span>
          </div>
        </div>

        {/* Booking & Invoice Summary */}
        <div className="bg-[#F6EFE2] rounded p-6 border border-[#B8924A]/30 text-left space-y-4">
          <div className="flex justify-between items-start border-b border-[#B8924A]/20 pb-3">
            <div>
              <span className="label-caps text-[#B8924A]">Selected Chamber</span>
              <h3 className="font-serif text-xl text-[#1C1410]">{room}</h3>
            </div>
            <div className="text-right">
              <span className="label-caps text-[#B8924A] block mb-1">Settlement Status</span>
              {getMethodBadge()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-[#1C1410]">
            <div>
              <span className="text-gray-500 block">Check-in Date:</span>
              <span className="font-semibold">{checkIn} (from 2:00 PM)</span>
            </div>
            <div>
              <span className="text-gray-500 block">Check-out Date:</span>
              <span className="font-semibold">{checkOut} (until 11:00 AM)</span>
            </div>
            <div>
              <span className="text-gray-500 block">Property Location:</span>
              <span className="font-semibold">Civil Lines, Pune 411001</span>
            </div>
            <div>
              <span className="text-gray-500 block">Total Settled:</span>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-base font-bold text-[#5B1A1F]">{formatCurrency(total)}</span>
                {discount > 0 && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-medium">
                    Saved {formatCurrency(discount)} ({coupon})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 text-xs uppercase tracking-wider text-[#1C1410] hover:text-[#5B1A1F] border border-[#B8924A]/40 px-5 py-2.5 rounded-[3px] bg-[#F6EFE2] transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Confirmation Voucher</span>
          </button>

          <Link
            to="/account/bookings"
            className="bg-[#5B1A1F] hover:bg-[#782329] text-[#F6EFE2] text-xs uppercase tracking-[0.18em] px-6 py-2.5 rounded-[3px] border border-[#B8924A]/40 transition"
          >
            View My Itinerary
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmed;
