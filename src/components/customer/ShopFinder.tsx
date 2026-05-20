import React, { useState, useCallback, useMemo } from 'react';
import { Search, MapPin, Filter, ChevronRight, Navigation, ArrowRight, Store, List, Map as MapIcon, ExternalLink, Tag, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { Shop } from '../../types';

interface ShopFinderProps {
  shops: Shop[];
  isLoaded: boolean;
  onSelectShop: (shop: Shop) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 13.3392,
  lng: 77.1140
};

export const ShopFinder: React.FC<ShopFinderProps> = ({ shops, isLoaded, onSelectShop }) => {
  const [searchMode, setSearchMode] = useState<'nearby' | 'route'>('nearby');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Shop | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [routeShops, setRouteShops] = useState<Shop[]>([]);
  const [directionsError, setDirectionsError] = useState<string | null>(null);


  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Helper: Haversine distance in KM
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const directionsCallback = useCallback((result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
    if (status === 'OK' && result) {
      // Filter shops within the entire geographic bounds of the route
      const routeBounds = result.routes[0].bounds;

      const nearbyShops = shops.filter(shop => {
        if (!shop.coordinates) return false;
        const shopPoint = new google.maps.LatLng(shop.coordinates.lat, shop.coordinates.lng);
        
        // Show all shops within the rectangular area that contains the route
        return routeBounds.contains(shopPoint);
      });
      setRouteShops(nearbyShops);
      
      setDirections(result);
      setIsSearching(false);
      setDirectionsError(null);
      
      if (map && result.routes[0].bounds) {
        map.fitBounds(result.routes[0].bounds);
      }
    } else {
      console.error(`error fetching directions ${status}`);
      setDirectionsError(status === 'ZERO_RESULTS' ? 'No driving route found between these locations.' : `Google Maps Error: ${status}. Please ensure the Directions API is enabled in your Google Console.`);
      setIsSearching(false);
    }
  }, [shops, map]);

  const filteredShops = useMemo(() => {
    if (searchMode === 'route' && directions) {
      return routeShops;
    }
    
    return shops.filter(shop => {
      const name = shop.name || '';
      const address = shop.address || '';
      const query = (searchQuery || '').toLowerCase();
      
      return name.toLowerCase().includes(query) || 
             address.toLowerCase().includes(query);
    });
  }, [shops, searchQuery, searchMode, directions, routeShops]);

  const handleRouteSearch = () => {
    if (startPoint && destination) {
      setIsSearching(true);
      setDirections(null); // Reset previous route
    }
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const pos = { lat: latitude, lng: longitude };
          if (map) {
            map.panTo(pos);
            map.setZoom(15);
          } else {
            setMapCenter(pos);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not access your GPS location. Please check your browser permissions.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleViewOnMap = (shop: Shop) => {
    if (shop.coordinates) {
      setMapCenter({ lat: shop.coordinates.lat, lng: shop.coordinates.lng });
      setViewMode('map');
    }
  };

  // Auto-center map when search results found (Nearby mode)
  React.useEffect(() => {
    if (searchMode === 'nearby' && filteredShops.length > 0 && map && isSearching) {
      const firstShop = filteredShops[0];
      if (firstShop.coordinates) {
        map.panTo({ lat: firstShop.coordinates.lat, lng: firstShop.coordinates.lng });
        map.setZoom(14);
        setIsSearching(false);
      }
    }
  }, [filteredShops, searchMode, map, isSearching]);


  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Search Mode Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex bg-gray-100 p-1 rounded-2xl flex-1">
          <button onClick={() => { setSearchMode('nearby'); setDirections(null); }} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${searchMode === 'nearby' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}>Nearby</button>
          <button onClick={() => setSearchMode('route')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${searchMode === 'route' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}>Along Route</button>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}><List size={20} /></button>
          <button onClick={() => setViewMode('map')} className={`p-2 rounded-xl transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}><MapIcon size={20} /></button>
        </div>
      </div>

      {/* Search Input Section */}
      <AnimatePresence mode="wait">
        {searchMode === 'nearby' ? (
          <motion.div key="nearby" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for nearby Xerox shops..." className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <button 
              onClick={useCurrentLocation}
              className="p-4 bg-primary-muted text-primary rounded-2xl border border-primary/20 hover:bg-primary/20 transition-all"
              title="Use GPS Location"
            >
              <Navigation size={20} />
            </button>
          </motion.div>
        ) : (
          <motion.div key="route" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="relative">
                <input type="text" value={startPoint} onChange={(e) => setStartPoint(e.target.value)} placeholder="Starting point (e.g. Bandra, Mumbai)..." className="w-full pl-4 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium" />
                <button 
                  onClick={useCurrentLocation}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/5 rounded-lg transition-all"
                  title="Use My GPS Location"
                >
                  <Navigation size={18} />
                </button>
              </div>
              <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination (e.g. Borivali, Mumbai)..." className="w-full pl-4 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium" />
            </div>
            {directionsError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium">
                {directionsError}
              </div>
            )}
            {startPoint && destination && (
              <button disabled={isSearching} onClick={handleRouteSearch} className="w-full bg-[#4285F4] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50">
                {isSearching ? <Loader2 className="animate-spin" size={18} /> : <Navigation size={18} />}
                {isSearching ? 'Finding Route...' : 'Find Shops on Route'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shop List Section */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-4">
            {searchMode === 'route' && directions && (
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-blue-700 text-sm font-bold flex justify-between items-center">
                <span>{routeShops.length} shops found within 1km of your route</span>
                <button onClick={() => setViewMode('map')} className="text-primary underline">View on Map</button>
              </div>
            )}
            
            {filteredShops.length > 0 ? (
              filteredShops.map(shop => (
                <div key={shop.id} onClick={() => onSelectShop(shop)} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{shop.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={14} /> {shop.address}</p>
                    </div>
                    <div className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold border border-yellow-100">
                      {shop.rating || 5} ★
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Tag size={12} /> Services & Pricing
                    </p>
                    <div className="space-y-2">
                      {shop.services && typeof shop.services === 'object' && !Array.isArray(shop.services) ? (
                        Object.entries(shop.services).map(([name, price]) => (
                          <div key={name} className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-600">{name}</span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">₹{price as any}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(shop.services) && shop.services.length > 0 ? (
                            shop.services.map(s => (
                              <span key={s} className="text-[10px] font-bold bg-white border border-gray-200 text-gray-500 px-2 py-1 rounded-md lowercase">{s}</span>
                            ))
                          ) : <span className="text-xs text-gray-400 italic">No pricing available yet</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <button onClick={(e) => { e.stopPropagation(); handleViewOnMap(shop); }} className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1"><MapIcon size={14} /> Map</button>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1"><ExternalLink size={14} /> Google Maps</a>
                    </div>
                    <span className="text-sm font-bold text-primary flex items-center gap-1">Order Now <ChevronRight size={16} /></span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <Store className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500 font-medium">No shops found matching "{searchQuery}"</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[450px] rounded-3xl overflow-hidden border border-gray-200 shadow-inner relative z-0 bg-gray-100">
            {!isLoaded ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 italic text-gray-400">
                <Loader2 className="animate-spin mr-2" size={20} /> Loading Google Maps...
              </div>
            ) : (
              <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={13}
              onLoad={onMapLoad}
              onUnmount={onMapUnmount}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: [] // Standard look as requested
              }}
            >
              {filteredShops.map(shop => shop.coordinates && (
                <Marker
                  key={shop.id}
                  position={{ lat: shop.coordinates.lat, lng: shop.coordinates.lng }}
                  onClick={() => setSelectedMarker(shop)}
                />
              ))}

              {selectedMarker && selectedMarker.coordinates && (
                <InfoWindow
                  position={{ lat: selectedMarker.coordinates.lat, lng: selectedMarker.coordinates.lng }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="p-1 min-w-[150px]">
                    <h4 className="font-bold text-sm text-gray-900">{selectedMarker.name}</h4>
                    <p className="text-[10px] text-gray-500 mb-2">{selectedMarker.address}</p>
                    <button 
                      onClick={() => onSelectShop(selectedMarker)} 
                      className="w-full bg-primary text-white py-2 px-2 rounded-lg text-[10px] font-bold"
                    >
                      Select Shop
                    </button>
                  </div>
                </InfoWindow>
              )}

              {searchMode === 'route' && startPoint && destination && isSearching && (
                <DirectionsService
                  options={{
                    destination: destination,
                    origin: startPoint,
                    travelMode: 'DRIVING' as google.maps.TravelMode
                  }}
                  callback={directionsCallback}
                />
              )}

              {directions && (
                <DirectionsRenderer
                  options={{
                    directions: directions,
                    suppressMarkers: false,
                    polylineOptions: {
                      strokeColor: '#4285F4',
                      strokeWeight: 6,
                      strokeOpacity: 0.8
                    }
                  }}
                />
              )}
            </GoogleMap>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};