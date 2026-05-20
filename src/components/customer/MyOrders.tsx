import React, { useState } from 'react';
import { FileText, Clock, CreditCard, AlertCircle, ArrowLeft, Check, X, Printer, Download, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus, ADDITIONAL_SERVICES } from '../../types';

interface MyOrdersProps {
  orders: Order[];
  onFindShop: () => void;
  onBack: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export const MyOrders: React.FC<MyOrdersProps> = ({ orders, onFindShop, onBack, onUpdateStatus }) => {
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [showReceiptOrder, setShowReceiptOrder] = useState<Order | null>(null);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (order: Order) => {
    setIsPaying(true);

    try {
      const response = await fetch('http://localhost:5000/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: order.totalAmount,
          shopId: order.shopId 
        })
      });
      const data = await response.json();

      if (!data.id) throw new Error("Failed to create order");

      const res = await loadRazorpay();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        setIsPaying(false);
        return;
      }

      const options = {
        key: 'rzp_test_SaaF5s6ZUvI06w',
        amount: data.amount,
        currency: data.currency,
        name: "Catch A Copy",
        description: `Payment for Order ${order.id}`,
        order_id: data.id,
        handler: async function (response: any) {
          try {
            // Verify payment on the server
            const verifyRes = await fetch('http://localhost:5000/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();
            
            if (verifyData.status === 'ok') {
              console.log("✅ Payment Verified on Server");
              onUpdateStatus(order.id, 'Printing'); // Only move to Printing if verified
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (err) {
            console.error(err);
            alert("Payment verification failed. Please contact support if your money was deducted.");
          } finally {
            setIsPaying(false);
            setPayingOrderId(null);
          }
        },
        prefill: {
          name: order.customerName,
          email: "customer@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#e11d48"
        },
        modal: {
          ondismiss: function() {
            setIsPaying(false);
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error(error);
      alert("Something went wrong processing payment.");
      setIsPaying(false);
      setPayingOrderId(null);
    }
  };

  const calculateBasePrice = (order: Order) => {
    const perPage = order.options.color === 'Color' ? 10 : 2;
    return perPage * order.pageCount * order.options.copies;
  };

  const getServicePrice = (serviceId: string) => {
    return ADDITIONAL_SERVICES.find(s => s.id === serviceId)?.price || 0;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <AnimatePresence>
        {isPaying && payingOrderId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="bg-[#1C2434] p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600 p-1.5 rounded-lg">
                    <CreditCard size={18} />
                  </div>
                  <span className="font-bold tracking-tight">Razorpay</span>
                </div>
                <span className="text-xs font-medium opacity-60">TEST MODE</span>
              </div>
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Initiating Payment Gateway</h3>
                  <p className="text-gray-500 mt-1">Please do not close this window</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Amount to Pay</span>
                  <span className="text-lg font-black text-gray-900">₹{orders.find(o => o.id === payingOrderId)?.totalAmount}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showReceiptOrder && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowReceiptOrder(null)}
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowReceiptOrder(null)}
                className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="bg-primary-muted w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Printer className="text-primary" size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900">Payment Receipt</h3>
                  <p className="text-gray-500 font-medium text-sm">Order {showReceiptOrder.id}</p>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shop Name</p>
                        <p className="font-bold text-gray-900">{showReceiptOrder.shopName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                        <p className="font-bold text-gray-900 text-sm">
                          {showReceiptOrder.createdAt?.toDate ? showReceiptOrder.createdAt.toDate().toLocaleDateString() : new Date(showReceiptOrder.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">File Name</p>
                      <p className="font-bold text-gray-900 truncate">{showReceiptOrder.fileName}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Order Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">{showReceiptOrder.options.color} Print ({showReceiptOrder.options.copies} copies)</span>
                        <span className="font-bold text-gray-900">₹{calculateBasePrice(showReceiptOrder)}</span>
                      </div>
                      {showReceiptOrder.options.services.map(s => (
                        <div key={s} className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">{ADDITIONAL_SERVICES.find(as => as.id === s)?.name || s}</span>
                          <span className="font-bold text-gray-900">₹{getServicePrice(s)}</span>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total Paid</span>
                        <span className="text-2xl font-black text-primary">₹{showReceiptOrder.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <div className="bg-emerald-500 text-white p-1.5 rounded-lg">
                      <Check size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Payment Successful</p>
                      <p className="text-[10px] text-emerald-600 font-medium">Transaction ID: TXN-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <button className="flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors">
                      <Download size={18} /> Download
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors">
                      <Share2 size={18} /> Share
                    </button>
                  </div>

                  <button 
                    onClick={() => setShowReceiptOrder(null)}
                    className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors text-sm uppercase tracking-widest"
                  >
                    Close Receipt
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-primary transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold">My Print Orders</h2>
      </div>
      <div className="space-y-4 pb-24">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <FileText className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 font-medium">No orders yet. Start by picking a shop!</p>
            <button onClick={onFindShop} className="mt-4 text-primary font-bold">Find a Shop</button>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.id}</span>
                  <h3 className="font-bold text-lg">{order.shopName}</h3>
                  <p className="text-sm text-gray-500 truncate max-w-[200px]">{order.fileName}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  order.status === 'Ready' ? 'bg-green-100 text-green-600' : 
                  order.status === 'Printing' ? 'bg-blue-100 text-blue-600' : 
                  order.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                  order.status === 'Waiting for Payment' ? 'bg-amber-100 text-amber-600' :
                  order.status === 'Accepted' ? 'bg-primary-muted text-primary' :
                  'bg-primary-muted text-primary'
                }`}>
                  {order.status}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1 font-medium"><Clock size={14} className="text-primary" /> {order.pickupTime}</div>
                <div className="flex items-center gap-1 font-medium">
                  <CreditCard size={14} className={['Accepted', 'Printing', 'Ready', 'Collected'].includes(order.status) ? "text-green-500" : "text-gray-400"} /> 
                  <span className={['Accepted', 'Printing', 'Ready', 'Collected'].includes(order.status) ? "text-green-600 font-bold" : ""}>₹{order.totalAmount}</span>
                </div>
              </div>

              {order.status === 'Rejected' && order.rejectionReason && (
                <div className="bg-red-50 p-3 rounded-xl mb-4 flex items-start gap-2 border border-red-100">
                  <AlertCircle className="text-red-500 shrink-0" size={16} />
                  <div>
                    <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-0.5">Rejection Reason</p>
                    <p className="text-xs text-red-700 font-medium">{order.rejectionReason}</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                <div className="flex gap-2">
                  {order.options.services.map(s => (
                    <span key={s} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-500">{s}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {order.status === 'Waiting for Payment' && (
                    <button 
                      onClick={() => {
                        setPayingOrderId(order.id);
                        handlePayment(order);
                      }}
                      className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 hover:bg-emerald-700 transition-colors"
                    >
                      <CreditCard size={16} /> Pay Now
                    </button>
                  )}
                  {['Accepted', 'Printing', 'Ready', 'Collected'].includes(order.status) && (
                    <button 
                      onClick={() => setShowReceiptOrder(order)}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <FileText size={16} /> Receipt
                    </button>
                  )}
                  {order.status === 'Rejected' && (
                    <button onClick={onFindShop} className="text-orange-600 text-xs font-bold hover:underline">
                      Try Another Shop
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
