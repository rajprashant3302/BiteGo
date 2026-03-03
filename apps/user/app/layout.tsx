import './globals.css';
import { ReactNode } from 'react';
import SessionWrapper from '@/components/SessionWrapper'; 
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import CartSidebar from '@/components/cart/CartSidebar';
import ScheduleModalWrapper from '@/components/modals/ScheduleModalWrapper';
import AddToast from '@/components/home/AddToast';

export const metadata = {
  title: 'BiteGo — Food & Delivery',
  description: 'Order delicious meals from your local favorites.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FDFDFD] font-sans text-gray-900 flex flex-col selection:bg-orange-100">
        
        <SessionWrapper> 
          <CartProvider>
            <Navbar />
            <CartSidebar />
            <ScheduleModalWrapper />
            <AddToast />
            <div className="flex-1">{children}</div>
            <Footer />
            <BottomNav />
          </CartProvider>
        </SessionWrapper>

      </body>
    </html>
  );
}