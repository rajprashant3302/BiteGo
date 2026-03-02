'use client';

import { useCart } from '@/context/CartContext';
import ScheduleModal from './ScheduleModal';

export default function ScheduleModalWrapper() {
  const { isScheduleOpen, setIsScheduleOpen, handleScheduleConfirm } = useCart();

  return (
    <ScheduleModal
      open={isScheduleOpen}
      onClose={() => setIsScheduleOpen(false)}
      onConfirm={handleScheduleConfirm}
    />
  );
}