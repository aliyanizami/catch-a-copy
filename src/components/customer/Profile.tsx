import React from 'react';
import { User, Mail, Phone, MapPin, Shield, ChevronRight, LogOut, ArrowLeft, Bell, CreditCard, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { ThemeSwitcher } from '../ThemeSwitcher';

interface ProfileProps {
  userData: any;
  onLogout: () => void;
  onBack: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ userData, onLogout, onBack }) => {
  const user = {
    name: userData?.name || 'Customer',
    email: userData?.email || 'N/A',
    phone: userData?.phone || 'Not provided',
    address: userData?.address || 'Not provided',
  };

  const settings = [
    { icon: <Shield size={18} />, label: 'Privacy & Security', color: 'gray' },
    { icon: <CreditCard size={18} />, label: 'Payment Methods', color: 'blue' },
    { icon: <Bell size={18} />, label: 'Notifications', color: 'orange' },
    { icon: <HelpCircle size={18} />, label: 'Help & Support', color: 'emerald' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-primary transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold">My Profile</h2>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
        <div className="w-24 h-24 bg-primary-muted rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
          <User className="text-primary" size={40} />
        </div>
        <h3 className="text-xl font-bold">{user.name}</h3>
        <p className="text-gray-500 text-sm">{user.email}</p>
        <button className="mt-4 px-6 py-2 bg-primary-muted text-primary rounded-full text-sm font-bold hover:bg-primary-muted/80 transition-colors">
          Edit Profile
        </button>
      </div>

      <ThemeSwitcher />

      <div className="space-y-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <Mail size={20} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</p>
            <p className="font-bold text-sm">{user.email}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-xl text-green-600">
            <Phone size={20} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</p>
            <p className="font-bold text-sm">{user.phone}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
            <MapPin size={20} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Address</p>
            <p className="font-bold text-sm">{user.address}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
        {settings.map((item, index) => (
          <button 
            key={index} 
            className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${
                item.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                item.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                'bg-gray-100 text-gray-500'
              }`}>
                {item.icon}
              </div>
              <span className="font-bold text-sm">{item.label}</span>
            </div>
            <ChevronRight className="text-gray-300" size={18} />
          </button>
        ))}
      </div>

      <button 
        onClick={onLogout}
        className="w-full p-5 bg-white rounded-3xl border border-gray-100 flex items-center justify-between hover:bg-red-50 transition-colors text-red-600 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="bg-red-50 p-2 rounded-lg">
            <LogOut size={18} />
          </div>
          <span className="font-bold text-sm">Logout</span>
        </div>
        <ChevronRight className="text-red-300" size={18} />
      </button>
    </motion.div>
  );
};
