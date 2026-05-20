import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, Clock, AlertCircle, X } from 'lucide-react';
import { AppNotification } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'customer' | 'owner';
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  isOpen, 
  onClose, 
  role,
  notifications,
  onMarkAllRead,
  onClearAll
}) => {
  const formatTime = (createdAt: any) => {
    if (!createdAt) return 'Just now';
    try {
      // Handle Firestore Timestamp
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Just now';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-[70] overflow-hidden"
          >
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-primary" />
                <h3 className="font-bold text-sm">Notifications</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer relative ${!n.read ? 'bg-primary/5' : ''}`}
                  >
                    {!n.read && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                    )}
                    <div className="flex gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-lg h-fit ${
                        n.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                        n.type === 'warning' ? 'bg-orange-50 text-orange-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {n.type === 'success' ? <CheckCircle2 size={14} /> :
                         n.type === 'warning' ? <AlertCircle size={14} /> :
                         <Clock size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{n.title}</p>
                        <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{n.message}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wider">{formatTime(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Bell size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-medium">No new notifications</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-gray-50/50 border-t border-gray-50 flex justify-between text-center px-6">
              <button onClick={onMarkAllRead} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                Mark all as read
              </button>
              <button onClick={onClearAll} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline">
                Clear All
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
