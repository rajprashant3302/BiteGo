'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Button from '@/components/ui/Button';

export default function CartDrawer() {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cartItems, 
    cartTotal, 
    cartSubtotal, 
    deliveryFee, 
    addToCart, 
    removeFromCart,
    clearCart 
  } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 p-2 rounded-xl text-white">
                  <ShoppingBag size={20} />
                </div>
                <h2 className="text-xl font-black tracking-tight">Your Basket</h2>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartItems.length > 0 ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Items</span>
                    <button onClick={clearCart} className="text-xs font-black text-red-500 uppercase hover:underline">
                      Clear All
                    </button>
                  </div>
                  {cartItems.map((item) => (
                    <div key={item.ItemID} className="flex gap-4 group">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={item.ItemImageURL} alt={item.ItemName} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 leading-tight">{item.ItemName}</h4>
                        <p className="text-orange-500 font-black mt-1">₹{parseFloat(item.Price).toFixed(0)}</p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button 
                              onClick={() => removeFromCart(item.ItemID)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md transition-all"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="px-3 text-sm font-black">{item.quantity}</span>
                            <button 
                              onClick={() => addToCart(item)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md transition-all"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="text-gray-200" size={32} />
                  </div>
                  <h3 className="font-bold text-lg">Your cart is empty</h3>
                  <p className="text-gray-400 text-sm mt-1">Add some delicious items to get started!</p>
                </div>
              )}
            </div>

            {/* Footer / Summary */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t bg-gray-50/50 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Subtotal</span>
                    <span className="font-bold text-gray-900">₹{cartSubtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Delivery Fee</span>
                    <span className="font-bold text-gray-900">₹{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between text-xl pt-2 border-t border-gray-100">
                    <span className="font-black text-gray-900">Total</span>
                    <span className="font-black text-orange-500">₹{cartTotal.toFixed(0)}</span>
                  </div>
                </div>

                <Button className="w-full h-14 rounded-2xl text-lg gap-3" onClick={() => {/* Proceed to Checkout */}}>
                  Go to Checkout <ArrowRight size={20} />
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}