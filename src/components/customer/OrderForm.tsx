import React, { useState } from 'react';
import { ArrowLeft, Upload, Clock, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Shop, Order, ADDITIONAL_SERVICES } from '../../types';
import { auth } from '../../firebaseconfig';

interface OrderFormProps {
  shop: Shop;
  onComplete: (order: Order) => void;
  onCancel: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ shop, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [options, setOptions] = useState({
    color: 'B&W' as 'B&W' | 'Color',
    copies: 1,
    sides: 'Single' as 'Single' | 'Double',
    services: [] as string[]
  });
  
  const [files, setFiles] = useState<{ name: string; size: string; pages: number; url: string }[]>([]);
  const [pickupTime, setPickupTime] = useState('10:00 AM');
  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM',
    '7:00 PM'
  ];
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const processFile = (selectedFile: File) => {
    const sizeInMB = (selectedFile.size / (1024 * 1024)).toFixed(1);
    const fileId = `${Date.now()}-${selectedFile.name}`;
    
    // MOCK UPLOAD: Simulate a quick upload to bypass Firebase Storage
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 33;
      setUploadProgress(prev => ({ ...prev, [fileId]: Math.min(progress, 100) }));
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const newFile = {
            name: selectedFile.name,
            size: `${sizeInMB} MB`,
            pages: Math.floor(Math.random() * 10) + 1,
            url: "#mock-url"
          };
          setFiles(prev => [...prev, newFile]);
          setUploadProgress(prev => {
            const next = { ...prev };
            delete next[fileId];
            return next;
          });
        }, 300);
      }
    }, 200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const calculateTotal = () => {
    let base = options.color === 'Color' ? 10 : 2;
    const totalPages = files.reduce((sum, f) => sum + f.pages, 0);
    
    let printCost = 0;
    if (options.sides === 'Double') {
      // Calculate based on physical sheets of paper used
      const sheets = Math.ceil(totalPages / 2);
      // Double sided costs 1.5x the base rate per sheet (e.g., ₹3 for B&W instead of ₹4 for two singles)
      const doubleSidedSheetPrice = base * 1.5;
      printCost = Math.round(sheets * doubleSidedSheetPrice);
    } else {
      printCost = totalPages * base;
    }
    
    let total = printCost * options.copies;
    
    if (shop.services && typeof shop.services === 'object' && !Array.isArray(shop.services)) {
      options.services.forEach(serviceName => {
        // Find price in shop metadata OR fallback to official ADDITIONAL_SERVICES price
        const shopPrice = (shop.services as any)[serviceName];
        const officialPrice = ADDITIONAL_SERVICES.find(s => s.name === serviceName)?.price;
        
        total += shopPrice || officialPrice || 0;
      });
    }
    return total;
  };

  const handleSubmit = () => {
    const totalPages = files.reduce((sum, f) => sum + f.pages, 0);
    const amount = calculateTotal();
    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      shopId: shop.id,
      shopName: shop.name,
      customerName: 'Customer', // Would be from auth in a real app
      fileName: files.map(f => f.name).join(', '),
      fileUrl: files[0]?.url || "",
      fileSize: `${files.length} Files`,
      pageCount: totalPages,
      options,
      pickupTime,
      status: 'Pending Approval',
      totalAmount: amount,
      createdAt: new Date().toISOString(),
    };

    onComplete(newOrder);
  };

  const handleBack = () => {
    step > 1 ? setStep(step - 1) : onCancel();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      <div className="flex items-center justify-between">
        <button onClick={handleBack} className="text-gray-500 font-medium flex items-center gap-1"><ArrowLeft size={18} /> {step > 1 ? 'Back' : 'Cancel'}</button>
        <div className="flex gap-1">
          {[1, 2, 3].map(s => <div key={s} className={`h-1.5 w-8 rounded-full ${step >= s ? 'bg-primary' : 'bg-gray-200'}`} />)}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Upload Document</h2>
          <div 
            className={`border-2 border-dashed rounded-3xl p-10 text-center bg-white cursor-pointer relative ${isDragging ? 'border-primary bg-primary-muted' : 'border-gray-200'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              multiple 
              accept=".pdf,.doc,.docx,image/*" 
            />
            <div className="bg-primary-muted w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Upload className="text-primary" size={32} />
            </div>
            {files.length > 0 || Object.keys(uploadProgress).length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(Object.entries(uploadProgress) as [string, number][]).map(([id, progress]) => (
                  <div key={id} className="bg-blue-50 p-3 rounded-2xl border border-blue-100 mx-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-blue-600 truncate max-w-[120px]">{id.split('-').slice(1).join('-')}</span>
                      <span className="text-[10px] font-bold text-blue-600">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1 bg-blue-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-blue-600"
                      />
                    </div>
                  </div>
                ))}
                {files.map((f, i) => (
                  <div key={i} className="bg-primary/5 p-3 rounded-2xl flex justify-between items-center border border-primary/10 mx-2">
                    <span className="text-xs font-bold text-primary truncate max-w-[120px]">{f.name}</span>
                    <span className="text-[10px] bg-white px-2 py-1 rounded-lg border">{f.pages} pgs</span>
                  </div>
                ))}
                <p className="text-[10px] text-primary font-bold mt-2">+ Add more</p>
              </div>
            ) : (

              <div>
                <p className="font-bold text-lg">Tap to select files</p>
                <p className="text-sm text-gray-400">PDF, DOC, or Images</p>
              </div>
            )}
          </div>
          <button 
            disabled={files.length === 0} 
            onClick={() => setStep(2)} 
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold disabled:opacity-50"
          >
            Next: Print Options
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Print Configuration</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              {(['B&W', 'Color'] as const).map(c => (
                <button key={c} onClick={() => setOptions({...options, color: c})} className={`flex-1 p-4 rounded-2xl border-2 ${options.color === c ? 'border-primary bg-primary-muted text-primary' : 'border-gray-100 bg-white'}`}>
                  <p className="font-bold">{c}</p>
                  <p className="text-xs opacity-60">₹{c === 'Color' ? 10 : 2} / page</p>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              {(['Single', 'Double'] as const).map(s => (
                <button key={s} onClick={() => setOptions({...options, sides: s})} className={`flex-1 p-3 rounded-2xl border-2 ${options.sides === s ? 'border-primary bg-primary-muted text-primary' : 'border-gray-100 bg-white'}`}>
                  <p className="font-bold">{s} Sided</p>
                </button>
              ))}
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">Copies</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setOptions({...options, copies: Math.max(1, options.copies - 1)})} className="w-8 h-8 rounded-full bg-gray-100">-</button>
                <span className="font-bold">{options.copies}</span>
                <button onClick={() => setOptions({...options, copies: options.copies + 1})} className="w-8 h-8 rounded-full bg-gray-100">+</button>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100">
              <label className="text-sm font-bold text-gray-400 uppercase mb-3 block">Services</label>
              <div className="grid gap-2">
                {shop.services && typeof shop.services === 'object' && !Array.isArray(shop.services) ? (
                  Object.entries(shop.services)
                    .filter(([name]) => !['B&W', 'Color', 'B&W Printing'].includes(name))
                    .map(([name, price]) => (
                    <button key={name} type="button" onClick={() => {
                      const exists = options.services.includes(name);
                      setOptions({...options, services: exists ? options.services.filter(s => s !== name) : [...options.services, name]});
                    }} className={`flex justify-between p-3 rounded-xl border ${options.services.includes(name) ? 'border-primary bg-primary-muted' : 'border-gray-50 bg-gray-50'}`}>
                      <span className="text-sm font-medium">{name}</span>
                      <span className="text-xs font-bold text-primary">
                        +₹{price || ADDITIONAL_SERVICES.find(s => s.name === name)?.price || 0}
                      </span>
                    </button>
                  ))
                ) : <p className="text-xs text-gray-400 italic">No additional services</p>}
              </div>
            </div>
          </div>
          <button onClick={() => setStep(3)} className="w-full bg-primary text-white py-4 rounded-2xl font-bold">Next: Schedule & Confirm</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Finalize Order</h2>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center"><span className="text-gray-500">Shop</span><span className="font-bold">{shop.name}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Documents</span>
              <span className="font-bold">{files.length} files ({files.reduce((sum, f) => sum + f.pages, 0)} pages)</span>
            </div>
            <div className="flex justify-between items-center"><span className="text-gray-500">Setup</span><span className="font-bold">{options.color}, {options.sides} Sided, {options.copies} copies</span></div>
            <div className="space-y-3 pt-4 border-t border-gray-50">
              <label className="block text-sm font-bold text-gray-700">Pickup Time</label>
              <select
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div className="pt-4 border-t border-gray-50 flex justify-between items-center"><span className="text-lg font-bold">Total</span><span className="text-2xl font-black text-primary">₹{calculateTotal()}</span></div>
          </div>
          <button onClick={handleSubmit} className="w-full bg-primary text-white py-4 rounded-2xl font-bold">Submit Request</button>
        </div>
      )}
    </motion.div>
  );
};