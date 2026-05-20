import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, Mail, Lock, User, Store, ArrowRight, ChevronLeft, CheckCircle2, MapPin, Map as MapIcon, Navigation } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { auth, db } from '../../firebaseconfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { ADDITIONAL_SERVICES } from '../../types';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '300px'
};

const defaultCenter = {
  lat: 13.3392,
  lng: 77.1140
};

interface AuthPageProps {
  onLogin: (role: 'customer' | 'owner', registrationData?: { shopName?: string; services?: string[] }) => void;
  isLoaded: boolean;
  loginError?: string | null;
}

export default function AuthPage({ onLogin, isLoaded, loginError }: AuthPageProps) {
  const [role, setRole] = useState<'customer' | 'owner' | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [manualCoords, setManualCoords] = useState<{lat: number, lng: number} | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  const availableServices = ADDITIONAL_SERVICES.map(s => s.name);

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // App.tsx handles onAuthStateChanged
    } catch (err: any) {
      setErrorMsg(err.message || 'Google login failed');
      setIsGoogleLoading(false);
    }
  };

  const handleLocateOnMap = async () => {
    if (!shopAddress) {
      setErrorMsg('Please enter an address first to help center the map');
      return;
    }
    setIsLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(shopAddress)}&key=${apiKey}`);
      const data = await response.json();
      if (data.status === 'OK' && data.results[0]) {
        const location = data.results[0].geometry.location;
        setMapCenter({ lat: location.lat, lng: location.lng });
        setManualCoords({ lat: location.lat, lng: location.lng });
        setShowMapPicker(true);
      } else {
        setErrorMsg('Could not find that address on the map. You can still open the map and find it manually.');
        setShowMapPicker(true);
      }
    } catch (error) {
      setShowMapPicker(true);
    } finally {
      setIsLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setMapCenter(coords);
        setManualCoords(coords);
      }, () => {
        alert("Could not get your location. Please check browser permissions.");
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && !role) return;

    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userData: any = {
          uid: user.uid,
          email: user.email,
          name: name,
          role: role
        };

        if (role === 'owner') {
          userData.shopName = shopName;
          userData.shopAddress = shopAddress;
          userData.services = selectedServices;

          // Use manually picked coordinates or geocode the shop address
          let coordinates = manualCoords || { lat: 19.0760, lng: 72.8777 }; 
          
          if (!manualCoords) {
            try {
              const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
              const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(shopAddress)}&key=${apiKey}`);
              const data = await response.json();
              if (data.status === 'OK' && data.results[0]) {
                const location = data.results[0].geometry.location;
                coordinates = { lat: location.lat, lng: location.lng };
              }
            } catch (error) {
              console.error('Geocoding error:', error);
            }
          }

          // Create the shop entry so it appears in the customer discovery dashboard
          await setDoc(doc(db, 'shops', user.uid), {
            name: shopName,
            address: shopAddress,
            ownerId: user.uid,
            rating: 5.0, 
            distance: '0.1 km',
            coordinates: coordinates,
            services: selectedServices.reduce((acc, curr) => {
              const serviceInfo = ADDITIONAL_SERVICES.find(s => s.name === curr);
              return { ...acc, [curr]: serviceInfo ? serviceInfo.price : 20 };
            }, {})
          });
        }

        await setDoc(doc(db, 'users', user.uid), userData);
      } else {
        localStorage.setItem('active_role', role);
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("🔥 Auth Error Details:", err);
      let friendlyMsg = err.message || 'Authentication failed';
      if (err.code === 'auth/network-request-failed') {
        friendlyMsg = "Network error! Please check your internet connection and ensure your Firebase API key is valid and authorized for this domain.";
      }
      setErrorMsg(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSignUp && !role) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center space-y-8"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="bg-primary p-4 rounded-3xl shadow-xl shadow-primary/20">
              <Printer className="text-white w-12 h-12" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900">Catch A Copy</h1>
            <p className="text-gray-500 font-medium">Skip the queue, print from anywhere.</p>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Sign Up as</p>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => setRole('customer')}
                className="group bg-white p-6 rounded-3xl border-2 border-transparent hover:border-primary shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left"
              >
                <div className="bg-primary-muted p-3 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Customer</h3>
                  <p className="text-sm text-gray-500">I want to print documents</p>
                </div>
                <ArrowRight className="ml-auto text-gray-300 group-hover:text-primary transition-colors" size={20} />
              </button>

              <button
                onClick={() => setRole('owner')}
                className="group bg-white p-6 rounded-3xl border-2 border-transparent hover:border-primary shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left"
              >
                <div className="bg-primary-muted p-3 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                  <Store size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Shop Owner</h3>
                  <p className="text-sm text-gray-500">I want to manage my Xerox shop</p>
                </div>
                <ArrowRight className="ml-auto text-gray-300 group-hover:text-primary transition-colors" size={20} />
              </button>
            </div>
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={() => setIsSignUp(false)}
              className="text-sm font-semibold text-primary hover:text-primary-accent transition-colors"
            >
              Already have an account? Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100"
      >
        {isSignUp && (
          <button
            onClick={() => setRole(null)}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 font-medium mb-8 transition-colors"
          >
            <ChevronLeft size={20} /> Back
          </button>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-500 mt-2">
            {isSignUp ? `${role === 'customer' ? 'Customer' : 'Shop Owner'} Registration` : 'Login to Catch A Copy'}
          </p>
          {(errorMsg || loginError) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
              {errorMsg || loginError}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-5"
              >
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                {role === 'owner' && (
                  <>
                    <div className="relative">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Shop Name"
                        required
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          placeholder="Shop Address / Location"
                          required
                          value={shopAddress}
                          onChange={(e) => setShopAddress(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={handleLocateOnMap}
                        className="p-4 bg-primary-muted text-primary rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                        title="Locate on Map"
                      >
                         <MapIcon size={20} />
                      </button>
                    </div>

                    {showMapPicker && isLoaded && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-50 p-4 rounded-3xl border border-gray-100 space-y-4"
                      >
                        <div className="flex justify-between items-center px-1">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pin Shop Location</p>
                          <button type="button" onClick={useCurrentLocation} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                            <Navigation size={12} /> Use GPS
                          </button>
                        </div>
                        <div className="h-[200px] rounded-2xl overflow-hidden border border-gray-200">
                          <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%' }}
                            center={mapCenter}
                            zoom={15}
                            onClick={(e) => e.latLng && setManualCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
                          >
                            {(manualCoords || mapCenter) && (
                              <Marker 
                                position={manualCoords || mapCenter} 
                                draggable
                                onDragEnd={(e) => e.latLng && setManualCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
                              />
                            )}
                          </GoogleMap>
                        </div>
                        <p className="text-[10px] text-gray-400 italic px-1 text-center">
                          {manualCoords ? "✅ Location pinned! You can drag the red pin to fine-tune." : "Click map to place your shop's pin."}
                        </p>
                        <button 
                          type="button" 
                          onClick={() => setShowMapPicker(false)}
                          className="w-full bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold shadow-sm"
                        >
                          Confirm & Save Pin
                        </button>
                      </motion.div>
                    )}

                    <div className="space-y-3 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-700 font-bold text-sm mb-1">
                        <CheckCircle2 size={18} className="text-primary" />
                        <span>Additional Services Offered</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {availableServices.map((service) => (
                          <div key={service} className="flex items-center gap-2 group cursor-pointer" onClick={() => toggleService(service)}>
                            <Checkbox
                              id={service}
                              checked={selectedServices.includes(service)}
                              onCheckedChange={() => toggleService(service)}
                              className="rounded-md"
                            />
                            <Label
                              htmlFor={service}
                              className="text-xs text-gray-600 cursor-pointer group-hover:text-primary transition-colors"
                            >
                              {service}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-accent transition-all disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : (isSignUp ? 'Register' : 'Login')}
          </button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400 font-medium">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            )}
            {isGoogleLoading ? 'Connecting...' : 'Google'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setRole(null); }}
            className="text-sm font-semibold text-primary hover:text-primary-accent transition-colors"
          >
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
