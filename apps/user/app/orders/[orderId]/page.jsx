'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, ChevronRight, CheckCircle2, Clock, Wallet, FileText, Navigation, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import InvoiceTemplate from '@/components/cart/InvoiceTemplate';
import { biteToast } from '@/lib/toast';

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/api/orders/${orderId}`)
      .then(res => res.json())
      .then(data => setOrder(data));
  }, [orderId]);

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: data }
    );
    const result = await res.json();
    return result.secure_url;
  };

  const handleDownloadInvoice = async () => {
  if (isGenerating) return;
  setIsGenerating(true);
  const toastId = biteToast.success("Preparing your invoice...");

  try {
    // 1. Check DB (Keep existing logic)
    const checkRes = await fetch(`${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/api/orders/${orderId}/invoice-check`);
    const checkData = await checkRes.json();

    if (checkData.exists) {
      window.open(checkData.url, '_blank');
      biteToast.dismiss(toastId);
      setIsGenerating(false);
      return;
    }

    // 2. Generate PDF with "Sanitized" Canvas
    const invoiceElement = document.getElementById('invoice-pdf-template');
    
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      // This is the fix: It skips trying to parse complex CSS functions 
      // that html2canvas doesn't understand.
      onclone: (clonedDoc) => {
        const el = clonedDoc.getElementById('invoice-pdf-template');
        el.style.position = "relative";
        el.style.left = "0";
        // Force standard font stack to avoid parsing advanced font metrics
        el.style.fontFamily = "Arial, sans-serif";
      }
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const pdfBlob = pdf.output('blob');

    // 3. Upload & Save (Keep existing logic)
    const uploadedUrl = await uploadToCloudinary(pdfBlob);
    await fetch(`${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/api/orders/invoice/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, pdfUrl: uploadedUrl })
    });

    pdf.save(`BiteGo_Invoice_${orderId.slice(-6)}.pdf`);
    biteToast.success("Invoice ready!", { id: toastId });

  } catch (error) {
    console.error("Invoice Error:", error);
    biteToast.error("Rendering error. Try again.", { id: toastId });
  } finally {
    setIsGenerating(false);
  }
};

  if (!order) return <div className="min-h-screen bg-slate-50 p-12 animate-pulse" />;

  const steps = [
    { label: 'Confirmed', status: 'Placed' },
    { label: 'Preparing', status: 'Preparing' },
    { label: 'On the Way', status: 'PickedUp' },
    { label: 'Delivered', status: 'Delivered' },
  ];

  const currentStep = steps.findIndex(s => s.status === order.OrderStatus);

  return (
    <main className="min-h-screen bg-slate-50 pt-12 pb-24 font-sans">
      {/* Hidden Invoice Template for PDF Generation */}
      <InvoiceTemplate order={order} id="invoice-pdf-template" />

      <div className="max-w-4xl mx-auto px-6">
        <header className="flex items-center gap-6 mb-12">
          <button onClick={() => router.push('/orders')} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 hover:text-orange-500 transition-all">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Order Status</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <motion.div 
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/orders/${orderId}/track`)}
            className="bg-orange-500 p-6 rounded-[2.5rem] shadow-xl shadow-orange-200 cursor-pointer group relative overflow-hidden h-48"
          >
            <div className="absolute -right-4 -bottom-4 opacity-20 text-white group-hover:scale-110 transition-transform">
              <Navigation size={120} />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white"><Navigation size={24} /></div>
              <div>
                <h3 className="text-xl font-black text-white italic">Track Live</h3>
                <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mt-1">View Delivery Boy</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadInvoice}
            className={`bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 cursor-pointer group relative overflow-hidden h-48 ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="absolute -right-4 -bottom-4 opacity-5 text-slate-900 group-hover:scale-110 transition-transform">
              <FileText size={120} />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 italic">Invoice</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                  {isGenerating ? 'Generating...' : 'Download PDF'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ... (Rest of your Stepper and Info code remains the same) ... */}
        <section className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 mb-8 relative overflow-hidden">
          {/* Stepper implementation */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Live Update</p>
              <h2 className="text-2xl font-black text-slate-900 italic">#{orderId.slice(-6).toUpperCase()}</h2>
            </div>
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${order.OrderStatus === 'Delivered' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
              {order.OrderStatus}
            </div>
          </div>
          <div className="relative flex justify-between">
            <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 -z-0" />
            <div className="absolute top-5 left-0 h-1 bg-orange-500 transition-all duration-1000 -z-0" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} />
            {steps.map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${idx <= currentStep ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {idx < currentStep ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${idx <= currentStep ? 'text-slate-900' : 'text-slate-300'}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Cashback Card */}
        {order.OrderStatus === 'Delivered' && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 rounded-[2.5rem] p-8 mb-8 flex items-center justify-between text-white">
            <div>
              <h3 className="text-xl font-black italic mb-1">Loyalty Reward! ₿</h3>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-tight">10% BiteCoins added to wallet</p>
            </div>
            <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-slate-900 shadow-xl shadow-yellow-400/20 rotate-12">
              <Wallet size={32} />
            </div>
          </motion.div>
        )}
        
        {/* Driver and Order Detail Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Delivery Partner</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black">{order.deliveryPartner?.user?.Name[0] || '?'}</div>
                <div>
                  <p className="font-black text-slate-900">{order.deliveryPartner?.user?.Name || 'Assigning...'}</p>
                  <p className="text-xs font-bold text-slate-400">4.8 ★ Professional</p>
                </div>
              </div>
              {order.deliveryPartner?.user?.Phone && (
                <a href={`tel:${order.deliveryPartner.user.Phone}`} className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200"><Phone size={20} /></a>
              )}
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Bill Summary</p>
            <div className="space-y-3">
              {order.items.map(item => (
                <div key={item.OrderItemID} className="flex justify-between text-sm">
                  <span className="font-black text-slate-900">{item.Quantity}x <span className="text-slate-400 font-bold ml-1">{item.item.ItemName}</span></span>
                  <span className="font-bold text-slate-900">₹{parseFloat(item.ItemPrice).toFixed(0)}</span>
                </div>
              ))}
              <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                <span className="text-xs font-black uppercase text-slate-400">Total Paid</span>
                <span className="text-xl font-black text-orange-500">₹{parseFloat(order.TotalAmount).toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}