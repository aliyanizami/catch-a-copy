import React, { useState, useEffect } from 'react';
import { Printer, User, Store, Bell } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { collection, query, where, orderBy, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { db, auth } from '../firebaseconfig';
import { AppNotification, Order } from '../types';

interface LayoutProps {
  role: 'customer' | 'owner';
  orders?: Order[];
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ role, children, orders = [] }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: AppNotification[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppNotification[];
      setNotifications(fetched);
    }, (error) => {
      console.error("❌ Notifications sync error:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    
    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        const ref = doc(db, "notifications", n.id);
        batch.update(ref, { read: true });
      });
      await batch.commit();
      console.log("✅ Marked all as read");
    } catch (err) {
      console.error("❌ Error marking as read:", err);
    }
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        const ref = doc(db, "notifications", n.id);
        batch.delete(ref);
      });
      await batch.commit();
    } catch (err) {
      console.error("❌ Error clearing notifications:", err);
    }
  };

  const hasUnread = notifications.some(n => !n.read);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <Printer className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-primary-accent">Catch A Copy</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {role === 'customer' ? <User size={16} /> : <Store size={16} />}
            <span className="capitalize">{role === 'customer' ? 'Customer' : 'Shop Owner'}</span>
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`p-2 rounded-xl transition-all ${isNotificationsOpen ? 'bg-primary-muted text-primary' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            >
              <Bell size={20} />
              {hasUnread && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary border-2 border-white rounded-full" />}
            </button>
            <NotificationDropdown 
              isOpen={isNotificationsOpen} 
              onClose={() => setIsNotificationsOpen(false)} 
              role={role}
              notifications={notifications}
              onMarkAllRead={handleMarkAllRead}
              onClearAll={handleClearAll}
            />
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 pb-24">
        {children}
      </main>
    </div>
  );
};
