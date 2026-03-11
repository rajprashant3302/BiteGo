// src/lib/toast.js
import toast from 'react-hot-toast';
import { FiCheck, FiAlertCircle, FiShoppingBag } from 'react-icons/fi';

export const biteToast = {
  success: (message) => 
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-in fade-in slide-in-from-bottom-4' : 'animate-out fade-out slide-out-to-bottom-4'
        } max-w-md w-full bg-white shadow-2xl rounded-[2rem] pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-2 border-orange-500/10 p-4`}
      >
        <div className="flex-1 w-0 flex items-center p-2">
          <div className="flex-shrink-0 pt-0.5">
            <div className="h-12 w-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
              <FiCheck size={24} strokeWidth={3} />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Success</p>
            <p className="mt-1 text-xs font-bold text-gray-500">{message}</p>
          </div>
        </div>
      </div>
    ), { duration: 3000 }),

  error: (message) => 
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-in fade-in slide-in-from-bottom-4' : 'animate-out fade-out slide-out-to-bottom-4'
        } max-w-md w-full bg-white shadow-2xl rounded-[2rem] pointer-events-auto flex border-2 border-red-500/20 p-4`}
      >
        <div className="flex-1 w-0 flex items-center p-2">
          <div className="flex-shrink-0 pt-0.5">
            <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
              <FiAlertCircle size={24} strokeWidth={3} />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Error</p>
            <p className="mt-1 text-xs font-bold text-gray-500">{message}</p>
          </div>
        </div>
      </div>
    ), { duration: 4000 }),

  cart: (itemName) => 
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-in fade-in slide-in-from-bottom-4' : 'animate-out fade-out slide-out-to-bottom-4'
        } max-w-md w-full bg-orange-500 shadow-2xl shadow-orange-200 rounded-[2rem] pointer-events-auto flex p-4 text-white`}
      >
        <div className="flex-1 w-0 flex items-center p-2">
          <div className="flex-shrink-0 pt-0.5">
            <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <FiShoppingBag size={24} strokeWidth={3} />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-black uppercase tracking-widest">Added to Cart</p>
            <p className="mt-1 text-xs font-bold opacity-90">{itemName} is ready for checkout!</p>
          </div>
        </div>
      </div>
    ), { duration: 2500 }),
};