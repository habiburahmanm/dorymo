import React, { useState, useMemo, useDeferredValue } from 'react';
import { useEcosystem } from '../context/EcosystemContext';
import { IntentCategory, ServiceListing, EquipmentItem } from '../types';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Wrench,
  Laptop,
  Plus,
  ArrowRight,
  Truck,
  Sparkles,
  Info,
  Tag,
  SlidersHorizontal,
  Phone,
  Edit3,
  X,
  Navigation,
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export const ServiceFinder: React.FC = () => {
  const {
    activeIntent,
    setActiveIntent,
    searchQuery,
    setSearchQuery,
    selectedSubcategory,
    setSelectedSubcategory,
    radiusKm,
    setRadiusKm,
    priceRange,
    setPriceRange,
    listings,
    equipment,
    savedAddresses,
    userLocation,
    setUserLocation,
    addToCart,
    setCurrentView,
    seedAuthenticRegistry,
  } = useEcosystem();

  const [selectedSlot, setSelectedSlot] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [equipmentDays, setEquipmentDays] = useState<Record<string, number>>({});
  const [equipmentLogistics, setEquipmentLogistics] = useState<Record<string, 'delivery' | 'depot'>>({});
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [isLocationEditorOpen, setIsLocationEditorOpen] = useState(false);
  const [customLocationInput, setCustomLocationInput] = useState(userLocation);

  // React 19 Concurrent deferred search query for 0ms input lag
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const activeAddress = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  // Dynamic Subcategory Facets computed sub-millisecond
  const availableSubcategories = useMemo(() => {
    if (activeIntent === 'equipment_rental') {
      const cats = new Set(equipment.map((e) => e.category));
      return Array.from(cats);
    }
    const cats = new Set(
      listings.filter((l) => l.category === activeIntent).map((l) => l.subcategory)
    );
    return Array.from(cats);
  }, [listings, equipment, activeIntent]);

  // Sub-millisecond Dynamic Facet Filter for Listings
  const filteredListings = useMemo(() => {
    if (activeIntent === 'equipment_rental') return [];
    const query = deferredSearchQuery.trim().toLowerCase();

    return listings.filter((l) => {
      // 1. Vector intent filter
      if (l.category !== activeIntent) return false;

      // 2. Dynamic subcategory facet
      if (selectedSubcategory && l.subcategory !== selectedSubcategory) return false;

      // 3. Price boundary
      if (l.rate > priceRange[1]) return false;

      // 4. Radius boundary for doorstep home repair
      if (activeIntent === 'home_repair' && l.serviceRadiusKm > 0 && l.serviceRadiusKm < radiusKm) {
        return false;
      }

      // 5. Keyword search query
      if (query) {
        const matchesTitle = l.title.toLowerCase().includes(query);
        const matchesDesc = l.description.toLowerCase().includes(query);
        const matchesSubcat = l.subcategory.toLowerCase().includes(query);
        const matchesProvider = l.providerName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesSubcat && !matchesProvider) {
          return false;
        }
      }

      return true;
    });
  }, [listings, activeIntent, selectedSubcategory, priceRange, radiusKm, deferredSearchQuery]);

  // Sub-millisecond Dynamic Facet Filter for Equipment
  const filteredEquipment = useMemo(() => {
    if (activeIntent !== 'equipment_rental') return [];
    const query = deferredSearchQuery.trim().toLowerCase();

    return equipment.filter((e) => {
      // 1. Dynamic category facet
      if (selectedSubcategory && e.category !== selectedSubcategory) return false;

      // 2. Price boundary
      if (e.dailyRate > priceRange[1]) return false;

      // 3. Keyword search query
      if (query) {
        const matchesTitle = e.title.toLowerCase().includes(query);
        const matchesNotes = e.conditionNotes.toLowerCase().includes(query);
        const matchesCategory = e.category.toLowerCase().includes(query);
        const matchesOwner = e.ownerName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesNotes && !matchesCategory && !matchesOwner) {
          return false;
        }
      }

      return true;
    });
  }, [equipment, activeIntent, selectedSubcategory, priceRange, deferredSearchQuery]);

  const handleAddToCartService = (listing: ServiceListing) => {
    const slot = selectedSlot[listing.id] || listing.availableSlots[0] || '10:00 AM';
    addToCart({
      id: `cart-srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      kind: 'service',
      refId: listing.id,
      title: listing.title,
      providerName: listing.providerName,
      providerPhone: listing.providerPhone,
      intent: listing.category,
      basePrice: listing.rate,
      securityDeposit: 0,
      quantityOrHours: listing.rateType === 'hourly' ? 2 : 1,
      scheduledDate: selectedDate,
      scheduledSlot: slot,
      fulfillmentType: listing.category === 'home_repair' ? 'onsite_doorstep' : 'remote_digital',
    });
    triggerToast(`Added ${listing.title} to mixed cart`);
  };

  const handleAddToCartEquipment = (item: EquipmentItem) => {
    const days = equipmentDays[item.id] || 2;
    const logistics = equipmentLogistics[item.id] || 'delivery';
    addToCart({
      id: `cart-eq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      kind: 'equipment',
      refId: item.id,
      title: item.title,
      providerName: item.ownerName,
      providerPhone: item.ownerPhone,
      intent: 'equipment_rental',
      basePrice: item.dailyRate,
      securityDeposit: item.securityDeposit,
      quantityOrHours: days,
      scheduledDate: selectedDate,
      scheduledSlot: 'Day Delivery (09:00 AM)',
      fulfillmentType: logistics === 'delivery' ? 'equipment_delivery' : 'equipment_pickup',
    });
    triggerToast(`Added ${item.title} (${days} days + ${formatCurrency(item.securityDeposit)} deposit)`);
  };

  const triggerToast = (msg: string) => {
    setAddedToast(msg);
    setTimeout(() => setAddedToast(null), 3500);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Toast Alert for Cart Micro-Interactions */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-orange-500/40 bg-zinc-950 p-3.5 text-xs text-white shadow-xl glow-orange animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-orange-400" />
          <span>{addedToast}</span>
          <button
            onClick={() => setCurrentView('hybrid_checkout')}
            className="ml-2 font-semibold text-orange-400 underline hover:text-orange-300"
          >
            View Cart &rarr;
          </button>
        </div>
      )}

      {/* Dynamic Facet Search & Filter Bar */}
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-5 shadow-lg space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-center">
          {/* Search Input with 0ms React 19 Deferred Sync */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search services, certifications, tools, models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-zinc-900 py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Active Intent Selector */}
          <div className="lg:col-span-4 flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-zinc-900/60 p-1 text-xs">
            <button
              onClick={() => {
                setActiveIntent('home_repair');
                setSelectedSubcategory(null);
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors',
                activeIntent === 'home_repair' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Wrench className="h-3 w-3 text-orange-400" />
              <span>Doorstep Repairs</span>
            </button>
            <button
              onClick={() => {
                setActiveIntent('equipment_rental');
                setSelectedSubcategory(null);
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors',
                activeIntent === 'equipment_rental' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Layers className="h-3 w-3 text-orange-400" />
              <span>Equipment Rental</span>
            </button>
            <button
              onClick={() => {
                setActiveIntent('digital_gig');
                setSelectedSubcategory(null);
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-colors',
                activeIntent === 'digital_gig' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Laptop className="h-3 w-3 text-orange-400" />
              <span>Digital Gigs</span>
            </button>
          </div>

          {/* Location Context (Set by User) & Radius */}
          <div className="lg:col-span-4 flex items-center justify-between gap-3 text-xs text-zinc-400 border-t border-white/10 pt-3 lg:border-t-0 lg:pt-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setCustomLocationInput(userLocation);
                  setIsLocationEditorOpen(!isLocationEditorOpen);
                }}
                className="group flex items-center gap-1.5 rounded-md border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:border-orange-500/50 hover:text-white transition-all text-left"
                title="Click to set or change your location"
              >
                <MapPin className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                <span className="truncate max-w-[130px] font-medium text-white">
                  {userLocation || (activeAddress ? `${activeAddress.street}, ${activeAddress.city}` : 'Dhaka, Bangladesh')}
                </span>
                <span className="text-[10px] text-orange-400 font-mono underline decoration-orange-500/40">
                  Change
                </span>
              </button>

              {/* Location Setter Dropdown / Popover */}
              {isLocationEditorOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-xl border border-white/15 bg-zinc-950 p-3.5 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-orange-400" />
                      Set Your Current Location
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsLocationEditorOpen(false)}
                      className="text-zinc-500 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Enter City, Area or Street:</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Banani, Dhaka or Dhanmondi"
                        value={customLocationInput}
                        onChange={(e) => setCustomLocationInput(e.target.value)}
                        className="flex-1 rounded border border-white/10 bg-zinc-900 px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (customLocationInput.trim()) {
                              setUserLocation(customLocationInput.trim());
                              setIsLocationEditorOpen(false);
                              triggerToast(`Location set to: ${customLocationInput.trim()}`);
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customLocationInput.trim()) {
                            setUserLocation(customLocationInput.trim());
                            setIsLocationEditorOpen(false);
                            triggerToast(`Location set to: ${customLocationInput.trim()}`);
                          }
                        }}
                        className="rounded bg-orange-500 px-2.5 py-1 text-xs font-semibold text-black hover:bg-orange-400"
                      >
                        Set
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">Quick Select Area:</span>
                    <div className="flex flex-wrap gap-1">
                      {['Banani, Dhaka', 'Gulshan-2, Dhaka', 'Dhanmondi, Dhaka', 'Uttara, Dhaka', 'Mirpur, Dhaka', 'Chattogram'].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => {
                            setCustomLocationInput(loc);
                            setUserLocation(loc);
                            setIsLocationEditorOpen(false);
                            triggerToast(`Location set to: ${loc}`);
                          }}
                          className={cn(
                            'rounded border px-2 py-0.5 text-[10px] transition-colors',
                            userLocation === loc
                              ? 'border-orange-500 bg-orange-500/20 text-orange-300 font-medium'
                              : 'border-white/5 bg-zinc-900 text-zinc-400 hover:text-white'
                          )}
                        >
                          {loc.split(',')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {activeIntent === 'home_repair' && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-zinc-400">Radius: {radiusKm}km</span>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-16 accent-orange-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Subcategory Facet Filter Chips */}
        {availableSubcategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-3 text-xs">
            <span className="text-zinc-500 font-mono text-[11px] flex items-center gap-1 mr-1">
              <Tag className="h-3 w-3 text-orange-400" />
              <span>Facets:</span>
            </span>
            <button
              onClick={() => setSelectedSubcategory(null)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                selectedSubcategory === null
                  ? 'bg-orange-500 text-black font-semibold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              )}
            >
              All Categories
            </button>
            {availableSubcategories.map((subcat) => (
              <button
                key={subcat}
                onClick={() => setSelectedSubcategory(selectedSubcategory === subcat ? null : subcat)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                  selectedSubcategory === subcat
                    ? 'bg-orange-500 text-black font-semibold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
                )}
              >
                {subcat}
              </button>
            ))}
          </div>
        )}

        {/* Filter Controls Row: Date & Price Slider */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-zinc-400">Fulfillment Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded border border-white/10 bg-zinc-900 px-2 py-1 text-white text-[11px] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <span>Price Ceiling: <strong className="text-white font-mono">{formatCurrency(priceRange[1])}</strong></span>
            <input
              type="range"
              min="100"
              max="25000"
              step="250"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="w-24 accent-orange-500"
            />
          </div>
        </div>
      </div>

      {/* FEED CONTENT */}
      <div className="mt-8">
        {/* VIEW A: SERVICES (Home Repair or Digital Gig) */}
        {activeIntent !== 'equipment_rental' && (
          <div>
            <div className="mb-4 flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>Verified Providers Found: {filteredListings.length}</span>
              <span className="hidden sm:inline">Zero-Synthetic Constraint: Only authentic registered providers</span>
            </div>

            {filteredListings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-zinc-950/40 p-12 text-center space-y-3">
                <Wrench className="mx-auto h-8 w-8 text-zinc-600" />
                <h4 className="text-sm font-medium text-zinc-300">
                  No {activeIntent === 'home_repair' ? 'Doorstep Repair' : 'Digital Gig'} Providers In Selected Radar
                </h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  No listings matched your active filter or search criteria. Reset filters or populate authentic baseline registries.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedSubcategory(null);
                      setSearchQuery('');
                      setPriceRange([0, 1500]);
                    }}
                    className="rounded-md border border-white/15 bg-zinc-900 px-3.5 py-1.5 text-xs text-zinc-300 hover:text-white"
                  >
                    Reset Active Filters
                  </button>
                  <button
                    onClick={seedAuthenticRegistry}
                    className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-orange-400"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Seed Authentic Baseline</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredListings.map((listing) => {
                  const currentSlot = selectedSlot[listing.id] || listing.availableSlots[0] || '10:00 AM';
                  return (
                    <div
                      key={listing.id}
                      className="group flex flex-col justify-between rounded-xl border border-white/10 bg-zinc-950 p-5 transition-all hover:border-orange-500/40"
                    >
                      <div>
                        {/* Provider Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-[10px] uppercase text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                              {listing.subcategory}
                            </span>
                            <h4 className="mt-2 text-base font-semibold text-white tracking-tight group-hover:text-orange-400 transition-colors">
                              {listing.title}
                            </h4>
                            <p className="text-xs text-zinc-400 mt-0.5">By {listing.providerName}</p>
                          </div>
                          {listing.verified && (
                            <span className="text-emerald-400" title="KYC Identity Verified">
                              <ShieldCheck className="h-4 w-4" />
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="mt-3 text-xs text-zinc-400 leading-relaxed line-clamp-3">
                          {listing.description}
                        </p>

                        {/* Booking Slot Picker with Collision-Free Keys */}
                        <div className="mt-4 border-t border-white/5 pt-3">
                          <span className="block text-[11px] font-mono text-zinc-400 mb-1.5">
                            Available Booking Slots for {selectedDate}:
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {listing.availableSlots.map((slot, idx) => (
                              <button
                                key={`${listing.id}-slot-${idx}`}
                                type="button"
                                onClick={() => setSelectedSlot((prev) => ({ ...prev, [listing.id]: slot }))}
                                className={cn(
                                  'rounded border px-2 py-1 text-[11px] font-mono transition-all',
                                  currentSlot === slot
                                    ? 'border-orange-500 bg-orange-500/20 text-orange-300 font-medium'
                                    : 'border-white/5 bg-zinc-900 text-zinc-400 hover:border-white/15'
                                )}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Direct Provider Phone Number */}
                        {listing.providerPhone && (
                          <div className="mt-3 flex items-center justify-between rounded-md border border-white/5 bg-zinc-900/80 p-2 text-xs font-mono">
                            <span className="flex items-center gap-1.5 text-zinc-400">
                              <Phone className="h-3 w-3 text-orange-400" />
                              <span className="text-[11px]">Provider Hotline:</span>
                            </span>
                            <a
                              href={`tel:${listing.providerPhone}`}
                              className="text-orange-400 font-semibold hover:underline"
                              title="Call Provider Direct"
                            >
                              {listing.providerPhone}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Pricing & Add to Mixed Cart */}
                      <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between">
                        <div>
                          <span className="text-lg font-mono font-semibold text-white">
                            {formatCurrency(listing.rate)}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            /{listing.rateType === 'hourly' ? 'hr' : 'deliverable'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleAddToCartService(listing)}
                          className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white transition-all hover:border-orange-500/60 hover:bg-orange-500 hover:text-black"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW B: EQUIPMENT RENTAL INVENTORY */}
        {activeIntent === 'equipment_rental' && (
          <div>
            <div className="mb-4 flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>Verified Equipment Leases Available: {filteredEquipment.length}</span>
              <span className="hidden sm:inline">All rentals require refundable escrow security deposit hold</span>
            </div>

            {filteredEquipment.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-zinc-950/40 p-12 text-center space-y-3">
                <Layers className="mx-auto h-8 w-8 text-zinc-600" />
                <h4 className="text-sm font-medium text-zinc-300">
                  No Equipment in Active Depot for Selected Filters
                </h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Reset your filter criteria or seed authentic baseline machinery to inspect lease flows.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedSubcategory(null);
                      setSearchQuery('');
                      setPriceRange([0, 1500]);
                    }}
                    className="rounded-md border border-white/15 bg-zinc-900 px-3.5 py-1.5 text-xs text-zinc-300 hover:text-white"
                  >
                    Reset Active Filters
                  </button>
                  <button
                    onClick={seedAuthenticRegistry}
                    className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-orange-400"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Seed Authentic Inventory</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredEquipment.map((eq) => {
                  const days = equipmentDays[eq.id] || 2;
                  const logistics = equipmentLogistics[eq.id] || 'delivery';
                  return (
                    <div
                      key={eq.id}
                      className="group flex flex-col justify-between rounded-xl border border-white/10 bg-zinc-950 p-5 transition-all hover:border-orange-500/40"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded">
                                {eq.category}
                              </span>
                              <span className="font-mono text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                {eq.condition}
                              </span>
                            </div>
                            <h4 className="mt-2 text-base font-semibold text-white tracking-tight group-hover:text-orange-400 transition-colors">
                              {eq.title}
                            </h4>
                            <p className="text-xs text-zinc-400 mt-0.5">Depot Owner: {eq.ownerName}</p>
                          </div>
                        </div>

                        {/* Notes & Serial */}
                        <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                          {eq.conditionNotes}
                        </p>

                        {/* Rental Duration & Logistics Selection */}
                        <div className="mt-4 space-y-2 border-t border-white/5 pt-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Lease Duration:</span>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 7].map((d) => (
                                <button
                                  key={`days-${eq.id}-${d}`}
                                  type="button"
                                  onClick={() => setEquipmentDays((prev) => ({ ...prev, [eq.id]: d }))}
                                  className={cn(
                                    'rounded px-2 py-0.5 font-mono text-[11px] transition-colors',
                                    days === d
                                      ? 'bg-orange-500 text-black font-semibold'
                                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                                  )}
                                >
                                  {d}d
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Fulfillment Method:</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEquipmentLogistics((prev) => ({ ...prev, [eq.id]: 'delivery' }))}
                                className={cn(
                                  'flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors',
                                  logistics === 'delivery'
                                    ? 'bg-zinc-800 text-white border border-white/20'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                )}
                              >
                                <Truck className="h-3 w-3" />
                                <span>Courier Delivery</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEquipmentLogistics((prev) => ({ ...prev, [eq.id]: 'depot' }))}
                                className={cn(
                                  'rounded px-2 py-0.5 text-[11px] transition-colors',
                                  logistics === 'depot'
                                    ? 'bg-zinc-800 text-white border border-white/20'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                )}
                              >
                                <span>Depot Locker</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Depot Contact Number */}
                        {eq.ownerPhone && (
                          <div className="mt-3 flex items-center justify-between rounded-md border border-white/5 bg-zinc-900/80 p-2 text-xs font-mono">
                            <span className="flex items-center gap-1.5 text-zinc-400">
                              <Phone className="h-3 w-3 text-orange-400" />
                              <span className="text-[11px]">Depot Hotline:</span>
                            </span>
                            <a
                              href={`tel:${eq.ownerPhone}`}
                              className="text-orange-400 font-semibold hover:underline"
                            >
                              {eq.ownerPhone}
                            </a>
                          </div>
                        )}

                        {/* Escrow Deposit Segregation Callout */}
                        <div className="mt-3 rounded-lg border border-orange-500/20 bg-orange-500/5 p-2 text-[11px] text-orange-300 flex items-center justify-between font-mono">
                          <span>Security Escrow Hold:</span>
                          <span className="font-semibold text-white">{formatCurrency(eq.securityDeposit)}</span>
                        </div>
                      </div>

                      {/* Pricing & Add to Cart */}
                      <div className="mt-5 border-t border-white/5 pt-4 flex items-center justify-between">
                        <div>
                          <span className="text-lg font-mono font-semibold text-white">
                            {formatCurrency(eq.dailyRate * days)}
                          </span>
                          <span className="text-[11px] text-zinc-500"> ({days} days @ {formatCurrency(eq.dailyRate)}/d)</span>
                        </div>

                        <button
                          onClick={() => handleAddToCartEquipment(eq)}
                          className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white transition-all hover:border-orange-500/60 hover:bg-orange-500 hover:text-black"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Rent Tool</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
