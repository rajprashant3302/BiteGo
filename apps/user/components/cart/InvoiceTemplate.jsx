'use client';

import React from 'react';

export default function InvoiceTemplate({ order, id }) {
  if (!order) return null;

  // ── FIX: Hardcoded HEX colors only. ──
  // No Tailwind color classes to prevent html2canvas oklch/lab parsing crashes.
  const styles = {
    container: { 
      backgroundColor: '#ffffff', 
      color: '#0f172a',
      fontFamily: 'Arial, sans-serif', 
      lineHeight: '1.5'
    },
    mutedText: { color: '#94a3b8' },
    brandText: { color: '#f97316' },
    successText: { color: '#16a34a' },
    warningText: { color: '#ea580c' },
    border: { borderBottom: '2px solid #f1f5f9' },
    tableHeader: { backgroundColor: '#f8fafc' },
    rowBorder: { borderBottom: '1px solid #f1f5f9' }
  };

  // ── DYNAMIC MATH LOGIC ──
  const rawSubtotal = order.items?.reduce((sum, item) => sum + (item.Quantity * parseFloat(item.ItemPrice)), 0) || 0;
  
  const hasFreeDelivery = order.redemptions?.some(r => r.adminOffer?.RewardType === 'FreeDelivery');
  const deliveryFee = (hasFreeDelivery || rawSubtotal >= 299) ? 0 : 50;

  const walletPayment = order.payments?.find(p => p.PaymentMethod === 'Wallet' && p.PaymentStatus === 'Success');
  const walletAmount = walletPayment ? parseFloat(walletPayment.TotalAmount) : 0;

  const primaryPaymentMethod = order.payments?.find(p => p.PaymentMethod !== 'Wallet')?.PaymentMethod || 'Wallet';

  return (
    <div 
      id={id} 
      style={styles.container}
      className="p-10 w-[800px] absolute -left-[9999px] top-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex justify-between items-start pb-8" style={styles.border}>
        <div>
          <h1 className="text-4xl font-black italic" style={styles.brandText}>BiteGo</h1>
          <p className="text-xs font-bold uppercase tracking-widest mt-1" style={styles.mutedText}>Official Invoice</p>
        </div>
        <div className="text-right">
          <p className="font-black text-lg">Order #{order.OrderID?.slice(-6).toUpperCase()}</p>
          <p className="text-xs font-bold" style={styles.mutedText}>{new Date(order.OrderDateTime).toLocaleString()}</p>
        </div>
      </div>

      {/* Customer & Restaurant Info */}
      <div className="grid grid-cols-2 gap-10 py-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={styles.mutedText}>Customer</p>
          <p className="font-bold">{order.user?.Name}</p>
          <p className="text-sm" style={{ color: '#64748b' }}>{order.user?.Email}</p>
          <p className="text-sm" style={{ color: '#64748b' }}>{order.address?.AddressLine}, {order.address?.City}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={styles.mutedText}>Restaurant</p>
          <p className="font-bold">{order.restaurant?.Name}</p>
          <p className="text-sm" style={{ color: '#64748b' }}>{order.restaurant?.CategoryName}</p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr style={styles.tableHeader}>
            <th className="p-4 text-[10px] font-black uppercase tracking-widest" style={styles.mutedText}>Item</th>
            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-center" style={styles.mutedText}>Qty</th>
            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right" style={styles.mutedText}>Price</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, idx) => {
            const lineTotal = item.Quantity * parseFloat(item.ItemPrice);
            return (
              <tr key={idx} style={styles.rowBorder}>
                <td className="p-4 font-bold">{item.item?.ItemName}</td>
                <td className="p-4 font-bold text-center">{item.Quantity}</td>
                <td className="p-4 font-bold text-right">₹{lineTotal.toFixed(0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary Section */}
      <div className="mt-10 flex justify-end">
        <div className="w-80 space-y-3">
          
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="font-bold" style={styles.mutedText}>Item Total</span>
            <span className="font-bold">₹{rawSubtotal.toFixed(0)}</span>
          </div>

          {/* Stacked Discounts */}
          {order.redemptions?.map((redemption) => {
            if (redemption.adminOffer?.RewardType === 'FreeDelivery') return null;
            
            const isManual = !!redemption.adminOffer?.PromoCode;
            const meta = typeof redemption.Metadata === 'string' ? JSON.parse(redemption.Metadata) : (redemption.Metadata || {});
            const discountValue = parseFloat(meta.discountApplied || 0);
            
            if (discountValue === 0) return null;

            return (
              <div key={redemption.RedemptionID} className="flex justify-between text-sm" style={styles.successText}>
                <span className="font-bold">
                  {redemption.adminOffer?.Title} {isManual && `(${redemption.adminOffer.PromoCode})`}
                </span>
                <span className="font-bold">- ₹{discountValue.toFixed(0)}</span>
              </div>
            );
          })}

          {/* Delivery Fee */}
          <div className="flex justify-between text-sm">
            <span className="font-bold" style={styles.mutedText}>Delivery Fee</span>
            <span className="font-bold" style={deliveryFee === 0 ? styles.successText : { color: '#0f172a' }}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </span>
          </div>

          {/* Wallet Deductions */}
          {walletAmount > 0 && (
            <div className="flex justify-between text-sm" style={styles.warningText}>
              <span className="font-bold">Wallet Applied</span>
              <span className="font-bold">- ₹{walletAmount.toFixed(0)}</span>
            </div>
          )}

          {/* Final Total Paid */}
          <div className="flex justify-between items-end pt-4 mt-2" style={{ borderTop: '2px solid #0f172a' }}>
            <div>
              <span className="font-black uppercase text-xs" style={styles.mutedText}>Paid via {primaryPaymentMethod}</span>
              <p className="font-black text-xl" style={styles.brandText}>Total</p>
            </div>
            <span className="font-black text-2xl" style={styles.brandText}>₹{parseFloat(order.TotalAmount).toFixed(0)}</span>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-20 text-center pt-8" style={{ borderTop: '1px solid #f1f5f9' }}>
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#cbd5e1' }}>Thank you for choosing BiteGo</p>
      </div>
    </div>
  );
}