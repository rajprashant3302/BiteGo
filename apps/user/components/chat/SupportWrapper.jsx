'use client';

import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import SupportIcon from './SupportIcon';

export default function SupportWrapper() {
  const { data: session } = useSession();

  // Extracting the userId from your NextAuth session (Prisma UserID)
  const userId = session?.user?.id;
  const token = session?.user?.accessToken;

  const { socket } = useSocket(token);

  if (!socket || !userId) return null;

  return (
    <SupportIcon 
      socket={socket} 
      senderId={userId} 
    />
  );
}