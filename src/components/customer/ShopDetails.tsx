import React from 'react';
import { ArrowLeft, Store, CheckCircle2, Upload, MapPin, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { Shop } from '../../types';

interface ShopDetailsProps {
  shop: Shop;
  onBack: () => void;
  onStartOrder: () => void;
}

export const ShopDetails: React.FC<ShopDetailsProps> = ({ shop, onBack, onStartOrder }) => {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 font-medium">
        <ArrowLeft size={20} /> Back to Shops
      </button>

      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
        <div className="h-48 bg-primary relative">
          <img src={shop.image} alt={shop.name} className="w-full h-full object-cover opacity-80" />
          <div className="absolute -bottom-6 left-6 w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
            <Store className="text-primary w-10 h-10" />
          </div>
        </div>
        <div className="pt-10 p-8">
          <h2 className="text-3xl font-bold">{shop.name}</h2>
          <p className="text-gray-500 mt-1 font-medium">{shop.address}</p>
          
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-primary-muted p-4 rounded-3xl text-center border border-primary-muted/20">
              <p className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">Rating</p>
              <p className="text-xl font-black text-primary">{shop.rating} ★</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-3xl text-center border border-blue-100">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Distance</p>
              <p className="text-xl font-black text-blue-600">{shop.distance}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-3xl text-center border border-emerald-100">
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Status</p>
              <p className="text-xl font-black text-emerald-600">Open</p>
            </div>
          </div>

          {shop.services && shop.services.length > 0 && (
            <div className="mt-10">
              <h3 className="text-lg font-bold mb-4">Available Services</h3>
              <div className="grid grid-cols-2 gap-3">
                {shop.services.map((s) => (
                  <div key={s} className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <CheckCircle2 size={16} className="text-primary" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10">
            <h3 className="text-lg font-bold mb-4">Location</h3>
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                  <MapPin size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{shop.address}</p>
                  <p className="text-xs text-gray-500 mt-1">Open 09:00 AM - 09:00 PM</p>
                </div>
              </div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}${shop.coordinates ? `&query=${shop.coordinates.lat},${shop.coordinates.lng}` : ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white border border-gray-200 py-3 rounded-2xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <ExternalLink size={16} /> View on Google Maps
              </a>
            </div>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-bold mb-4">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <img 
                  key={i} 
                  src={`https://picsum.photos/seed/shop-${shop.id}-${i}/300/300`} 
                  alt="Shop" 
                  className="w-full h-24 object-cover rounded-2xl border border-gray-100 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Reviews</h3>
              <button className="text-sm text-primary font-bold">See All</button>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Rahul S.', rating: 5, comment: 'Fastest service in the campus! The spiral binding was perfect.' },
                { name: 'Priya M.', rating: 4, comment: 'Good quality color prints. A bit crowded during exam times.' }
              ].map((review, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm">{review.name}</span>
                    <span className="text-xs font-bold text-primary">{review.rating} ★</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={onStartOrder}
            className="w-full mt-10 bg-primary text-white py-5 rounded-3xl font-bold shadow-xl shadow-primary/20 hover:bg-primary-accent transition-all flex items-center justify-center gap-3 text-lg"
          >
            <Upload size={24} /> Upload Files & Order
          </button>
        </div>
      </div>
    </motion.div>
  );
};
