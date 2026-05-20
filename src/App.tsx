/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { MapPin, FileText, User, LogOut, HelpCircle } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Layout } from './components/Layout';
import { ShopFinder } from './components/customer/ShopFinder';
import { useJsApiLoader } from '@react-google-maps/api';

const LIBRARIES: ("geometry" | "drawing" | "places")[] = ['geometry'];
import { ShopDetails } from './components/customer/ShopDetails';
import { OrderForm } from './components/customer/OrderForm';
import { MyOrders } from './components/customer/MyOrders';
import { Profile } from './components/customer/Profile';
import { InfoPage } from './components/customer/InfoPage';
import { Dashboard } from './components/owner/Dashboard';
import { ShopSettings } from './components/owner/ShopSettings';
import AuthPage from './components/auth/AuthPage';
import { Order, Shop, OrderStatus } from './types';
import { SHOPS } from './constants';
import { collection, addDoc, updateDoc, setDoc, onSnapshot, query, where, doc, getDoc, getDocs, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from './firebaseconfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';

type Role = 'customer' | 'owner';
type CustomerView = 'home' | 'shop-details' | 'order-form' | 'my-orders' | 'profile' | 'info';
type OwnerView = 'dashboard' | 'settings';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [role, setRole] = useState<Role>('customer');
  const [customerView, setCustomerView] = useState<CustomerView>('home');
  const [ownerView, setOwnerView] = useState<OwnerView>('dashboard');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [userData, setUserData] = useState<any>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES
  });

  const [myShop, setMyShop] = useState<Shop | null>(null);

  // Orders are now managed via Firestore listener
  useEffect(() => {
    if (!isAuthenticated || !auth.currentUser) {
      setOrders([]);
      return;
    }

    const uid = auth.currentUser.uid;
    const ordersRef = collection(db, "orders");
    
    // Create query based on user role
    const q = role === 'customer' 
      ? query(ordersRef, where("customerId", "==", uid))
      : query(ordersRef, where("shopId", "==", uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(updatedOrders);
      console.log(`✅ Syncing ${updatedOrders.length} orders for ${role}`);
    }, (error) => {
      console.error("❌ Firestore listener error:", error);
    });

    return () => unsubscribe();
  }, [isAuthenticated, role]);
  
  useEffect(() => {
    const shopsRef = collection(db, "shops");
    const unsubscribe = onSnapshot(shopsRef, (snapshot) => {
      const shopData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Shop[];
      setAllShops(shopData);
      console.log("✅ Syncing all shops from Firebase");
    }, (error) => {
      console.error("❌ Firebase Shop Sync Error:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let userUnsubscribe: () => void = () => {};
    let shopUnsubscribe: () => void = () => {};

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthLoading(false); // Do not block UI waiting for firestore
        // 1. Listen to general user data (Role, Name, etc.)
        userUnsubscribe = onSnapshot(doc(db, 'users', user.uid), async (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data();
            localStorage.removeItem('expected_login_role');

            setLoginError(null);
            setUserData(data);
            setRole(data.role as Role);
            setIsAuthenticated(true);

            // 2. If owner, also listen to their shop details
            if (data.role === 'owner') {
              shopUnsubscribe = onSnapshot(doc(db, 'shops', user.uid), (shopDoc) => {
                if (shopDoc.exists()) {
                  setMyShop({ id: shopDoc.id, ...shopDoc.data() } as Shop);
                }
              });
            }
          } else {
            // Document hasn't been created yet. Wait for the registration logic in AuthPage to finish creating it.
            // Do not call setIsAuthenticated(true) here, otherwise it unmounts the AuthPage prematurely and cancels the save!
          }
        }, (error) => {
          console.error("Error listening to user data:", error);
        });
      } else {
        setIsAuthenticated(false);
        setRole('customer');
        setUserData(null);
        setMyShop(null);
        setIsAuthLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      userUnsubscribe();
      shopUnsubscribe();
    };
  }, []);

  const handleLogin = (selectedRole: Role, registrationData?: { shopName?: string; shopAddress?: string; services?: string[] }) => {
    setRole(selectedRole);
    setIsAuthenticated(true);
    
    if (selectedRole === 'owner' && registrationData?.shopName) {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const newShop: Shop = {
        id: uid, // Use User ID as Shop ID for owners
        name: registrationData.shopName,
        address: registrationData.shopAddress || 'Address not provided',
        rating: 5.0,
        distance: '0.1 km',
        image: 'https://picsum.photos/seed/newshop/800/600',
        services: registrationData.services || ['B&W Printing', 'Color'],
        coordinates: { lat: 13.3392, lng: 77.1140 }
      };

      setDoc(doc(db, 'shops', uid), newShop);
    }

    if (selectedRole === 'customer') {
      setCustomerView('home');
    } else {
      setOwnerView('dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleCreateOrder = async (newOrder: Order) => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const orderData = {
        ...newOrder,
        customerId: uid,
        createdAt: serverTimestamp(),
      };
      
      // Delete the temporary client-side ID to let Firestore generate one
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...dataToSave } = orderData;
      
      const orderRef = await addDoc(collection(db, "orders"), dataToSave);
      
      await addDoc(collection(db, "notifications"), {
        userId: dataToSave.shopId,
        title: 'New Order!',
        message: `Request for ${dataToSave.fileName} from customer.`,
        type: 'warning',
        read: false,
        createdAt: serverTimestamp()
      });
      
      setCustomerView('my-orders');
      console.log("✅ Order saved to Firestore");
    } catch (err) {
      console.error("❌ Order Creation Error:", err);
      alert("Failed to place order. Check console.");
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, reason?: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { 
        status: newStatus, 
        ...(reason && { rejectionReason: reason })
      });

      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        let title = 'Order Update';
        let type = 'info';
        
        if (newStatus === 'Accepted') { title = 'Order Accepted'; type = 'success'; }
        else if (newStatus === 'Rejected') { title = 'Order Rejected'; type = 'warning'; }
        else if (newStatus === 'Ready') { title = 'Order Ready!'; type = 'success'; }
        else if (newStatus === 'Collected') { title = 'Order Picked Up'; type = 'success'; }
        else if (newStatus === 'Waiting for Payment') { title = 'Payment Required'; type = 'warning'; }

        await addDoc(collection(db, "notifications"), {
          userId: targetOrder.customerId,
          title,
          message: `Your order for ${targetOrder.shopName} is now ${newStatus}.`,
          type,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      console.log(`✅ Order ${orderId} status updated to ${newStatus}`);
    } catch (err) {
      console.error("❌ Status Update Error:", err);
    }
  };
  const handleSaveShop = async (updatedShop: Shop) => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      await setDoc(doc(db, 'shops', uid), updatedShop);
      console.log("✅ Shop settings persisted to Firestore");
    } catch (err) {
      console.error("❌ Shop Save Error:", err);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} isLoaded={isLoaded} loginError={loginError} />;
  }

  return (
    <Layout role={role} orders={orders}>
      <div className="absolute top-4 right-16 z-[60]">
        <button 
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-xl border border-gray-100 shadow-sm"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {role === 'customer' ? (
          <>
            {customerView === 'home' && (
              <ShopFinder 
                shops={allShops}
                isLoaded={isLoaded}
                onSelectShop={(shop) => { setSelectedShop(shop); setCustomerView('shop-details'); }} 
              />
            )}
            {customerView === 'shop-details' && selectedShop && (
              <ShopDetails 
                shop={selectedShop} 
                onBack={() => setCustomerView('home')} 
                onStartOrder={() => setCustomerView('order-form')} 
              />
            )}
            {customerView === 'order-form' && selectedShop && (
              <OrderForm 
                shop={selectedShop} 
                onComplete={handleCreateOrder} 
                onCancel={() => setCustomerView('shop-details')} 
              />
            )}
            {customerView === 'my-orders' && (
              <MyOrders 
                orders={orders} 
                onFindShop={() => setCustomerView('home')} 
                onBack={() => setCustomerView('home')}
                onUpdateStatus={updateOrderStatus}
              />
            )}
            {customerView === 'profile' && (
              <Profile 
                userData={userData}
                onLogout={handleLogout} 
                onBack={() => setCustomerView('home')}
              />
            )}
            {customerView === 'info' && (
              <InfoPage onBack={() => setCustomerView('home')} />
            )}
          </>
        ) : (
          <>
            {ownerView === 'dashboard' && (
              <Dashboard 
                orders={orders} 
                onUpdateStatus={updateOrderStatus} 
                onOpenSettings={() => setOwnerView('settings')}
                onLogout={handleLogout}
              />
            )}
            {ownerView === 'settings' && myShop && (
              <ShopSettings 
                shop={myShop} 
                onSave={handleSaveShop} 
                onBack={() => setOwnerView('dashboard')} 
              />
            )}
          </>
        )}
      </AnimatePresence>
       
	   
      {/* Bottom Navigation for Customer */}
      {role === 'customer' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-[90]">
          <button onClick={() => setCustomerView('home')} className={`flex flex-col items-center gap-1 ${customerView === 'home' || customerView === 'shop-details' || customerView === 'order-form' ? 'text-primary' : 'text-gray-400'}`}>
            <MapPin size={20} />
            <span className="text-[10px] font-medium uppercase tracking-wider">Find Shop</span>
          </button>
          <button onClick={() => setCustomerView('my-orders')} className={`flex flex-col items-center gap-1 ${customerView === 'my-orders' ? 'text-primary' : 'text-gray-400'}`}>
            <FileText size={20} />
            <span className="text-[10px] font-medium uppercase tracking-wider">My Orders</span>
          </button>
          <button onClick={() => setCustomerView('profile')} className={`flex flex-col items-center gap-1 ${customerView === 'profile' ? 'text-primary' : 'text-gray-400'}`}>
            <User size={20} />
            <span className="text-[10px] font-medium uppercase tracking-wider">Profile</span>
          </button>
          <button onClick={() => setCustomerView('info')} className={`flex flex-col items-center gap-1 ${customerView === 'info' ? 'text-primary' : 'text-gray-400'}`}>
            <HelpCircle size={20} />
            <span className="text-[10px] font-medium uppercase tracking-wider">Info</span>
          </button>
        </nav>
      )}
    </Layout>
  );
}

