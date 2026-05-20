import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle, Info, CreditCard, CheckCircle2, ChevronRight, ArrowLeft, Mail, Phone } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

interface InfoPageProps {
  onBack: () => void;
}

export const InfoPage: React.FC<InfoPageProps> = ({ onBack }) => {
  const [showContact, setShowContact] = React.useState(false);
  const steps = [
    { title: 'Upload', desc: 'Upload your PDF or images directly from your phone.', icon: <Info className="text-blue-500" /> },
    { title: 'Configure', desc: 'Choose B&W or Color, number of copies, and binding options.', icon: <CreditCard className="text-primary" /> },
    { title: 'Select Shop', desc: 'Pick a nearby shop or one along your route.', icon: <CheckCircle2 className="text-emerald-500" /> },
    { title: 'Pick Up', desc: 'Pay online and collect your prints at the scheduled time.', icon: <HelpCircle className="text-purple-500" /> },
  ];

  const pricing = [
    { item: 'B&W Print', price: '₹2 / page' },
    { item: 'Color Print', price: '₹10 / page' },
    { item: 'Spiral Binding', price: '₹30' },
    { item: 'Lamination', price: '₹20' },
    { item: 'Hard Binding', price: '₹100' },
  ];

  const faqs = [
    { q: 'How do I pay for my order?', a: 'We support all major UPI apps, cards, and netbanking via Razorpay. Payment is required to confirm your order.' },
    { q: 'Can I cancel my order?', a: 'You can cancel your order as long as the shop owner hasn\'t accepted it yet. Once accepted, the printing process starts and cancellation is not possible.' },
    { q: 'What if the shop rejects my order?', a: 'If a shop rejects your order (e.g., due to maintenance), a full refund is automatically initiated to your original payment method.' },
    { q: 'What file formats are supported?', a: 'We currently support PDF, DOCX, and common image formats (JPG, PNG). For best results, we recommend using PDF.' },
    { q: 'How long will the shop keep my prints?', a: 'Shops usually keep your prints for up to 24 hours after your scheduled pickup time. However, we recommend picking them up within 2 hours.' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-24">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-primary transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Help & Information</h2>
      </div>

      {/* How it Works */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 px-2">
          <div className="w-1.5 h-6 bg-primary rounded-full" />
          How it Works
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {steps.map((step, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
              <div className="bg-gray-50 p-3 rounded-xl">
                {step.icon}
              </div>
              <div>
                <p className="font-bold text-sm">{step.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 px-2">
          <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
          Standard Pricing
        </h3>
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          {pricing.map((p, i) => (
            <div key={i} className={`flex items-center justify-between p-4 ${i !== pricing.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <span className="text-sm font-medium text-gray-700">{p.item}</span>
              <span className="text-sm font-black text-primary">{p.price}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 px-2">
          <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
          Recently Asked Questions
        </h3>
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm px-2">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b border-gray-50 last:border-0">
                <AccordionTrigger className="text-left text-sm font-bold py-4 px-4 hover:no-underline hover:text-primary transition-colors">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-500 px-4 pb-4 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <div className="bg-primary p-6 rounded-[2rem] text-white shadow-xl shadow-primary/20">
        <h4 className="font-bold mb-2">Still have questions?</h4>
        <p className="text-xs opacity-80 mb-4">Our support team is available 24/7 to help you with your printing needs.</p>
        {!showContact ? (
          <button 
            onClick={() => setShowContact(true)}
            className="w-full bg-white text-primary py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            Contact Support <ChevronRight size={16} />
          </button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <a href="mailto:support@catchacopy.com" className="flex items-center gap-3 bg-white/10 p-3 rounded-xl hover:bg-white/20 transition-colors">
              <Mail size={18} />
              <span className="text-sm font-bold">support@catchacopy.com</span>
            </a>
            <a href="tel:+919876543210" className="flex items-center gap-3 bg-white/10 p-3 rounded-xl hover:bg-white/20 transition-colors">
              <Phone size={18} />
              <span className="text-sm font-bold">+91 9876543210</span>
            </a>
            <button 
              onClick={() => setShowContact(false)}
              className="w-full text-center text-[10px] font-bold uppercase tracking-widest opacity-60 mt-2"
            >
              Hide Details
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
