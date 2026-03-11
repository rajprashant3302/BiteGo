'use client';

import React from 'react';

export default function InvoiceTemplate({ order, id }) {
  if (!order) return null;

  const styles = {
    // Explicitly using HEX to override any inherited oklch/lab values
    container: { 
      backgroundColor: '#ffffff', 
      color: '#0f172a',
      fontFamily: 'Arial, sans-serif', // Standard font helps parsing
      lineHeight: '1.5'
    },
    mutedText: { color: '#94a3b8' },
    brandText: { color: '#f97316' },
    border: { borderBottom: '2px solid #f1f5f9' },
    tableHeader: { backgroundColor: '#f8fafc' },
    rowBorder: { borderBottom: '1px solid #f1f5f9' }
  };

  return (
    <div 
      id={id} 
      style={styles.container}
      // The "absolute" positioning keeps it out of view but ready for capture
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
          {order.items?.map((item, idx) => (
            <tr key={idx} style={styles.rowBorder}>
              <td className="p-4 font-bold">{item.item?.ItemName}</td>
              <td className="p-4 font-bold text-center">{item.Quantity}</td>
              <td className="p-4 font-bold text-right">₹{parseFloat(item.ItemPrice).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="mt-10 flex justify-end">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-bold" style={styles.mutedText}>Subtotal</span>
            <span className="font-bold">₹{parseFloat(order.TotalAmount).toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-bold" style={styles.mutedText}>Delivery</span>
            <span className="font-bold text-green-600">FREE</span>
          </div>
          <div className="flex justify-between pt-3" style={{ borderTop: '2px solid #0f172a' }}>
            <span className="font-black uppercase text-xs">Total Paid</span>
            <span className="font-black text-xl" style={styles.brandText}>₹{parseFloat(order.TotalAmount).toFixed(0)}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-20 text-center pt-8" style={{ borderTop: '1px solid #f1f5f9' }}>
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#cbd5e1' }}>Thank you for choosing BiteGo</p>
      </div>
    </div>
  );
}