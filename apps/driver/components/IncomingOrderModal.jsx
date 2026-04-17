"use client";

export default function IncomingOrderModal({ order, onAccept, onDecline }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-80 text-center space-y-4">
        <h2 className="font-bold text-lg">New Order</h2>

        <p>Order #{order.orderId.slice(-6)}</p>

        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 bg-gray-200 py-2 rounded"
          >
            Decline
          </button>

          <button
            onClick={onAccept}
            className="flex-1 bg-orange-500 text-white py-2 rounded"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}