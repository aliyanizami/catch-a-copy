import React, { useState } from 'react';
import { Store, MapPin, Clock, Camera, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Shop, ADDITIONAL_SERVICES } from '../../types';

interface ShopSettingsProps {
  shop: Shop;
  onSave: (updatedShop: Shop) => void;
  onBack: () => void;
}

const CORE_SERVICES = ['B&W Printing', 'Color'];

export const ShopSettings: React.FC<ShopSettingsProps> = ({ shop, onSave, onBack }) => {
  const [formData, setFormData] = useState({
    name: shop.name,
    address: shop.address,
    rating: shop.rating,
    distance: shop.distance,
    image: shop.image,
    services: shop.services || ['B&W', 'Color'],
    razorpayAccountId: shop.razorpayAccountId,
  });

  const toggleService = (serviceName: string) => {
    const currentServices = formData.services;
    if (currentServices.includes(serviceName)) {
      setFormData({ ...formData, services: currentServices.filter(s => s !== serviceName) });
    } else {
      setFormData({ ...formData, services: [...currentServices, serviceName] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...shop, ...formData });
    onBack();
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl border border-gray-100 text-gray-400">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold">Shop Settings</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative group">
          <div className="w-full h-48 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-lg">
            <img src={formData.image} alt="Shop" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
              <button type="button" className="bg-white/90 p-3 rounded-full text-gray-700 shadow-xl">
                <Camera size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Shop Name</label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Location Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-4 block">Available Services</label>
            <div className="grid grid-cols-2 gap-2">
              {[...CORE_SERVICES, ...ADDITIONAL_SERVICES.map(s => s.name)].map(service => (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${formData.services.includes(service) ? 'bg-primary-muted border-primary text-primary' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                >
                  <CheckCircle2 size={16} className={formData.services.includes(service) ? 'text-primary' : 'text-gray-300'} />
                  <span className="text-xs font-bold">{service}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-4 block">Operating Hours</label>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <Clock className="text-primary" size={18} />
                <span className="font-bold text-sm">Daily Schedule</span>
              </div>
              <span className="text-sm font-medium text-gray-500">09:00 AM - 09:00 PM</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-blue-100 shadow-sm bg-blue-50/30">
            <div className="flex items-center gap-2 mb-4">
              <label className="text-[10px] font-bold text-blue-500 uppercase tracking-widest ml-1">Razorpay Payouts</label>
              <span className="text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-black uppercase">Required</span>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="acc_XXXXXXXXXXXXXX"
                  value={formData.razorpayAccountId || ''}
                  onChange={(e) => setFormData({ ...formData, razorpayAccountId: e.target.value })}
                  className="w-full pl-4 pr-4 py-3 bg-white border border-blue-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-xs"
                />
              </div>
              <p className="text-[10px] text-gray-400 italic px-1">Enter your Linked Account ID from Razorpay Route Dashboard.</p>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-accent transition-all flex items-center justify-center gap-2"
        >
          <Save size={20} /> Save Changes
        </button>
      </form>
    </motion.div>
  );
};
