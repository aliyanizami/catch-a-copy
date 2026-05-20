import React, { useState } from 'react';
import { Settings, Printer, Clock, FileText, Check, X, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus } from '../../types';
import { REJECTION_REASONS } from '../../constants';

interface DashboardProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus, reason?: string) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ orders, onUpdateStatus, onOpenSettings, onLogout }) => {
  const [activeTab, setActiveTab] = useState<OrderStatus | 'All'>('Pending Approval');
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);

  const filteredOrders = activeTab === 'All' ? orders : orders.filter((o) => o.status === activeTab);
  
  // This calculates the real numbers from your Firebase orders array
  const dynamicStats = [
    { label: 'New', count: orders.filter(o => o.status === 'Pending Approval').length, bg: 'bg-primary-muted', text: 'text-primary' },
    { label: 'Payment', count: orders.filter(o => o.status === 'Waiting for Payment').length, bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Printing', count: orders.filter(o => o.status === 'Printing').length, bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Ready', count: orders.filter(o => o.status === 'Ready').length, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  ];
  

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onLogout} className="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-primary transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold">Shop Dashboard</h2>
        </div>
        <button 
          onClick={onOpenSettings}
          className="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-primary transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>

      
      <div className="grid grid-cols-4 gap-3">
        {dynamicStats.map((stat) => (
          <div key={stat.label} className={`${stat.bg} p-3 rounded-2xl border border-transparent transition-all`}>
            <p className={`text-[9px] font-bold uppercase tracking-wider opacity-60 ${stat.text}`}>{stat.label}</p>
            <p className={`text-xl font-black ${stat.text}`}>{stat.count}</p>
          </div>
        ))}
      </div>  
      

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['Pending Approval', 'Waiting for Payment', 'Accepted', 'Printing', 'Ready', 'Collected', 'Rejected', 'All'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white text-gray-500 border border-gray-100'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Printer className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 font-medium">No orders in this category</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.id}</span>
                    {['Accepted', 'Printing', 'Ready', 'Collected'].includes(order.status) && (
                      <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Payment Verified</span>
                    )}
                    {order.status === 'Waiting for Payment' && (
                      <span className="bg-amber-100 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Unpaid</span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg">{order.customerName}</h3>
                  <div className="flex items-center gap-2 text-sm text-primary font-bold">
                    <Clock size={14} /> Pickup: {order.pickupTime}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase">Amount</p>
                  <p className="text-lg font-black">₹{order.totalAmount}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-gray-400" />
                  <span className="text-sm font-bold truncate">{order.fileName}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded font-bold text-gray-600">{order.options.color}</span>
                  <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded font-bold text-gray-600">{order.options.copies} Copies</span>
                  {order.options.services.map(s => (
                    <span key={s} className="text-[10px] bg-primary-muted text-primary px-2 py-0.5 rounded font-bold">{s}</span>
                  ))}
                </div>
              </div>

              {order.status === 'Rejected' && order.rejectionReason && (
                <div className="bg-red-50 p-3 rounded-xl mb-4 flex items-start gap-2">
                  <AlertCircle className="text-red-500 shrink-0" size={16} />
                  <p className="text-xs text-red-700 font-medium">Reason: {order.rejectionReason}</p>
                </div>
              )}

              <div className="flex gap-2">
                {order.status === 'Pending Approval' && (
                  <>
                    <button 
                      onClick={() => onUpdateStatus(order.id, 'Waiting for Payment')} 
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-green-600/20 flex items-center justify-center gap-2"
                    >
                      <Check size={16} /> Accept
                    </button>
                    <button 
                      onClick={() => setRejectingOrderId(order.id)} 
                      className="flex-1 bg-red-600 text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-red-600/20 flex items-center justify-center gap-2"
                    >
                      <X size={16} /> Reject
                    </button>
                  </>
                )}
                {order.status === 'Waiting for Payment' && (
                  <div className="flex-1 bg-amber-50 text-amber-700 py-3 rounded-xl text-xs font-bold text-center border border-amber-100">
                    Waiting for customer payment...
                  </div>
                )}
                {order.status === 'Accepted' && (
                  <button onClick={() => onUpdateStatus(order.id, 'Printing')} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20">Start Printing</button>
                )}
                {order.status === 'Printing' && (
                  <button onClick={() => onUpdateStatus(order.id, 'Ready')} className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-green-600/20">Mark as Ready</button>
                )}
                {order.status === 'Ready' && (
                  <button onClick={() => onUpdateStatus(order.id, 'Collected')} className="flex-1 bg-gray-800 text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-gray-800/20">Mark Collected</button>
                )}
                <button 
  onClick={() => {
    // If the order has our mock URL, open it in a new window
    if (order.fileUrl) {
      window.open(order.fileUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback alert if URL is missing
      const fileList = order.fileName.split(', ');
      alert(`📄 Documents to Print:\n\n${fileList.map((name, i) => `${i + 1}. ${name}`).join('\n')}`);
    }
  }}
  className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
>
  View File
</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rejection Reason Modal */}
      <AnimatePresence>
        {rejectingOrderId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-4">Reject Order</h3>
              <p className="text-sm text-gray-500 mb-6">Please select a reason for rejecting this order. An automatic refund will be triggered.</p>
              
              <div className="space-y-2 mb-8">
                {REJECTION_REASONS.map(reason => (
                  <button
                    key={reason}
                    onClick={() => {
                      onUpdateStatus(rejectingOrderId, 'Rejected', reason);
                      setRejectingOrderId(null);
                    }}
                    className="w-full text-left p-4 rounded-2xl bg-gray-50 hover:bg-primary-muted hover:text-primary transition-all text-sm font-medium border border-transparent hover:border-primary-muted/20"
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setRejectingOrderId(null)}
                className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
