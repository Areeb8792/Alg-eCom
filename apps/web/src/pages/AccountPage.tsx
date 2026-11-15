import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  fetchCustomerAddresses,
  createCustomerAddress,
  deleteCustomerAddress,
  updateCustomerProfile,
  resendCustomerVerification
} from '../services/api.js';
import { CustomerAddress } from '../types/index.js';

export const AccountPage: React.FC = () => {
  const { user, preferences, token, isAuthenticated, logout, refreshProfile, openAuthModal, openOnboardingModal } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'PREFERENCES' | 'ADDRESSES' | 'SECURITY'>('PROFILE');
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Profile Edit State
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Address Form State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressLabel, setAddressLabel] = useState('Home / Studio');
  const [recipientName, setRecipientName] = useState(user?.full_name || '');
  const [addressPhone, setAddressPhone] = useState(user?.phone || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [isDefaultShipping, setIsDefaultShipping] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);

  // Verification state
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendHint, setResendHint] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal('LOGIN');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      setEditName(user.full_name);
      setEditPhone(user.phone || '');
    }
  }, [user]);

  const loadAddresses = async () => {
    if (!token) return;
    setLoadingAddresses(true);
    try {
      const data = await fetchCustomerAddresses(token);
      setAddresses(data);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ADDRESSES' && token) {
      loadAddresses();
    }
  }, [activeTab, token]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProfileSaving(true);
    setProfileSuccess(null);
    try {
      await updateCustomerProfile(token, { full_name: editName, phone: editPhone || null });
      await refreshProfile();
      setProfileSuccess('Dossier records updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingAddress(true);
    try {
      await createCustomerAddress(token, {
        label: addressLabel,
        recipient_name: recipientName,
        phone: addressPhone,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        state_province: stateProvince,
        postal_code: postalCode,
        country_code: countryCode,
        is_default_shipping: isDefaultShipping,
        is_default_billing: false
      });
      setShowAddressModal(false);
      // Reset form
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setStateProvince('');
      setPostalCode('');
      await loadAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!token) return;
    if (!confirm('Permanently purge this address record?')) return;
    try {
      await deleteCustomerAddress(token, addressId);
      await loadAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete address');
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;
    try {
      const res = await resendCustomerVerification(user.email);
      setResendStatus(res.message);
      if (res.verificationToken) {
        setResendHint(res.verificationToken);
      }
    } catch (err: any) {
      setResendStatus(err.message || 'Failed to dispatch verification email');
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-[#E3E2DE] text-[#1B0E0D]">
        <h1 className="font-clash text-3xl font-black uppercase mb-4">ACCESS RESTRICTED</h1>
        <p className="font-mono text-sm text-gray-700 mb-6">
          Identification required to inspect customer dossier and style parameters.
        </p>
        <button
          onClick={() => openAuthModal('LOGIN')}
          className="bg-[#1B0E0D] text-[#E3E2DE] px-8 py-3 font-clash font-bold uppercase tracking-wider hover:bg-[#C72A09] transition-colors shadow-[4px_4px_0px_#C72A09]"
        >
          AUTHENTICATE NOW →
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E3E2DE] text-[#1B0E0D] pt-28 pb-20 px-4 lg:px-12 selection:bg-[#1B0E0D] selection:text-[#E3E2DE]">
      {/* Editorial Top Dossier Header */}
      <div className="border-b-2 border-[#1B0E0D] pb-8 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 font-mono text-xs uppercase tracking-widest text-[#C72A09] font-bold">
              <span>DOSSIER #{user.id.substring(0, 8).toUpperCase()}</span>
              <span>//</span>
              <span>MEMBER SINCE {new Date(user.created_at).getFullYear()}</span>
            </div>
            <h1 className="font-clash text-4xl lg:text-6xl font-black uppercase tracking-tight leading-none">
              {user.full_name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {user.is_verified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#31EF07]/20 border border-[#31EF07] text-[#1B0E0D] font-mono text-xs font-bold uppercase">
                <span className="w-2 h-2 rounded-full bg-[#31EF07]" />
                VERIFIED IDENTITY
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-600 text-amber-900 font-mono text-xs font-bold uppercase">
                  UNVERIFIED IDENTITY
                </span>
                <button
                  onClick={() => openAuthModal('VERIFY')}
                  className="px-3 py-1 bg-[#C72A09] text-white font-mono text-xs font-bold uppercase hover:bg-[#1B0E0D] transition-colors"
                >
                  VERIFY TOKEN
                </button>
              </div>
            )}
            <button
              onClick={() => logout().then(() => navigate('/'))}
              className="px-4 py-1.5 border border-[#1B0E0D] font-mono text-xs font-bold uppercase hover:bg-[#1B0E0D] hover:text-[#E3E2DE] transition-colors"
            >
              TERMINATE SESSION
            </button>
          </div>
        </div>
      </div>

      {/* 12-Column Asymmetric Brutalist Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Column (Columns 1-4) */}
        <div className="lg:col-span-4 space-y-2 font-mono text-xs font-bold uppercase">
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`w-full text-left p-4 border border-[#1B0E0D] flex justify-between items-center transition-all ${
              activeTab === 'PROFILE'
                ? 'bg-[#1B0E0D] text-[#E3E2DE] shadow-[4px_4px_0px_#C72A09]'
                : 'bg-white hover:bg-[#1B0E0D]/10'
            }`}
          >
            <span>[01] PERSONAL DOSSIER</span>
            <span>→</span>
          </button>
          <button
            onClick={() => setActiveTab('PREFERENCES')}
            className={`w-full text-left p-4 border border-[#1B0E0D] flex justify-between items-center transition-all ${
              activeTab === 'PREFERENCES'
                ? 'bg-[#1B0E0D] text-[#E3E2DE] shadow-[4px_4px_0px_#31EF07]'
                : 'bg-white hover:bg-[#1B0E0D]/10'
            }`}
          >
            <span>[02] STYLE & FIT MATRIX</span>
            <span className="text-[#31EF07]">
              {preferences?.onboarding_completed ? '● ACTIVE' : '○ PENDING'}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ADDRESSES')}
            className={`w-full text-left p-4 border border-[#1B0E0D] flex justify-between items-center transition-all ${
              activeTab === 'ADDRESSES'
                ? 'bg-[#1B0E0D] text-[#E3E2DE] shadow-[4px_4px_0px_#C72A09]'
                : 'bg-white hover:bg-[#1B0E0D]/10'
            }`}
          >
            <span>[03] ADDRESS BOOK</span>
            <span>→</span>
          </button>
          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`w-full text-left p-4 border border-[#1B0E0D] flex justify-between items-center transition-all ${
              activeTab === 'SECURITY'
                ? 'bg-[#1B0E0D] text-[#E3E2DE] shadow-[4px_4px_0px_#C72A09]'
                : 'bg-white hover:bg-[#1B0E0D]/10'
            }`}
          >
            <span>[04] CREDENTIAL SECURITY</span>
            <span>→</span>
          </button>
          <button
            onClick={() => navigate('/track-order')}
            className="w-full text-left p-4 border border-[#1B0E0D] bg-white hover:bg-[#1B0E0D]/10 flex justify-between items-center transition-all"
          >
            <span>[05] ORDER LOGISTICS & TRACKING</span>
            <span>↗</span>
          </button>
        </div>

        {/* Content Column (Columns 5-12) */}
        <div className="lg:col-span-8 bg-white border-2 border-[#1B0E0D] shadow-[8px_8px_0px_#1B0E0D] p-6 lg:p-8">
          {/* TAB 1: PROFILE */}
          {activeTab === 'PROFILE' && (
            <div>
              <div className="border-b border-[#1B0E0D] pb-3 mb-6">
                <span className="font-mono text-[10px] tracking-widest text-[#C72A09] font-bold block uppercase">
                  SECTION [01]
                </span>
                <h2 className="font-clash text-2xl font-black uppercase">PERSONAL IDENTIFICATION</h2>
              </div>

              {profileSuccess && (
                <div className="mb-4 p-3 bg-green-50 border-l-4 border-[#31EF07] text-[#1B0E0D] font-mono text-xs">
                  {profileSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                <div>
                  <label className="block font-mono text-xs font-bold uppercase text-[#1B0E0D] mb-1">
                    PRIMARY COMMUNICATION ID (LOCKED)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full bg-gray-100 border border-gray-300 p-3 font-mono text-xs text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs font-bold uppercase text-[#1B0E0D] mb-1">
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#E3E2DE]/30 border border-[#1B0E0D] p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C72A09]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs font-bold uppercase text-[#1B0E0D] mb-1">
                    CONTACT TELEPHONE
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+1 555-0199"
                    className="w-full bg-[#E3E2DE]/30 border border-[#1B0E0D] p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C72A09]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="bg-[#1B0E0D] text-[#E3E2DE] px-6 py-3 font-clash font-bold uppercase tracking-wider text-xs hover:bg-[#C72A09] transition-colors shadow-[4px_4px_0px_#C72A09] disabled:opacity-60"
                >
                  {profileSaving ? 'SAVING...' : 'COMMIT PROFILE CHANGES →'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: STYLE & FIT PREFERENCES */}
          {activeTab === 'PREFERENCES' && (
            <div>
              <div className="flex justify-between items-start border-b border-[#1B0E0D] pb-3 mb-6">
                <div>
                  <span className="font-mono text-[10px] tracking-widest text-[#31EF07] font-bold block uppercase">
                    SECTION [02]
                  </span>
                  <h2 className="font-clash text-2xl font-black uppercase">FASHION & FIT SPECIFICATIONS</h2>
                </div>
                <button
                  onClick={openOnboardingModal}
                  className="px-3 py-1.5 bg-[#31EF07] text-[#1B0E0D] font-mono text-xs font-bold uppercase hover:bg-[#1B0E0D] hover:text-[#E3E2DE] transition-colors border border-[#1B0E0D]"
                >
                  RE-LAUNCH CURATION WIZARD ↗
                </button>
              </div>

              <div className="space-y-6">
                {/* Presentation Domain */}
                <div>
                  <span className="block font-mono text-xs font-bold uppercase text-gray-500 mb-1">
                    AESTHETIC DOMAIN
                  </span>
                  <div className="inline-block p-2 border border-[#1B0E0D] font-mono text-sm font-bold bg-[#E3E2DE]">
                    {preferences?.gender_presentation || 'ALL / NON-BINARY'}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <span className="block font-mono text-xs font-bold uppercase text-gray-500 mb-2">
                    ACTIVE FOCUS CATEGORIES
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {preferences?.favorite_categories && preferences.favorite_categories.length > 0 ? (
                      preferences.favorite_categories.map((c) => (
                        <span
                          key={c}
                          className="px-3 py-1 bg-[#1B0E0D] text-[#E3E2DE] font-mono text-xs font-bold uppercase"
                        >
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="font-mono text-xs text-gray-500 italic">No categories selected.</span>
                    )}
                  </div>
                </div>

                {/* Styles */}
                <div>
                  <span className="block font-mono text-xs font-bold uppercase text-gray-500 mb-2">
                    CURATED AESTHETICS
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {preferences?.preferred_styles && preferences.preferred_styles.length > 0 ? (
                      preferences.preferred_styles.map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1 border border-[#1B0E0D] bg-white font-mono text-xs font-bold uppercase"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="font-mono text-xs text-gray-500 italic">No styles selected.</span>
                    )}
                  </div>
                </div>

                {/* Fits & Sizes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="block font-mono text-xs font-bold uppercase text-gray-500 mb-2">
                      PREFERRED FITS
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {preferences?.preferred_fits?.map((f) => (
                        <span key={f} className="px-2.5 py-1 border border-gray-400 font-mono text-xs uppercase">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="block font-mono text-xs font-bold uppercase text-gray-500 mb-2">
                      SILHOUETTE SIZES
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {preferences?.preferred_sizes?.map((sz) => (
                        <span
                          key={sz}
                          className="w-8 h-8 border border-[#1B0E0D] bg-[#1B0E0D] text-[#E3E2DE] flex items-center justify-center font-mono text-xs font-bold"
                        >
                          {sz}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Palette */}
                <div>
                  <span className="block font-mono text-xs font-bold uppercase text-gray-500 mb-2">
                    COLOR SPECTRUM
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {preferences?.preferred_colors?.map((col) => (
                      <span
                        key={col}
                        className="px-3 py-1 border border-[#1B0E0D] bg-[#E3E2DE] font-mono text-xs font-bold uppercase"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div className="p-4 border border-[#1B0E0D] bg-[#E3E2DE]/50">
                  <span className="block font-mono text-xs font-bold uppercase text-gray-600 mb-1">
                    MAXIMUM PRICE THRESHOLD
                  </span>
                  <span className="font-clash text-2xl font-bold text-[#C72A09]">
                    ${((preferences?.price_range_max_cents || 350000) / 100).toLocaleString()} USD
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADDRESS BOOK */}
          {activeTab === 'ADDRESSES' && (
            <div>
              <div className="flex justify-between items-start border-b border-[#1B0E0D] pb-3 mb-6">
                <div>
                  <span className="font-mono text-[10px] tracking-widest text-[#C72A09] font-bold block uppercase">
                    SECTION [03]
                  </span>
                  <h2 className="font-clash text-2xl font-black uppercase">LOGISTICS ADDRESS BOOK</h2>
                </div>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="px-4 py-2 bg-[#1B0E0D] text-[#E3E2DE] font-clash text-xs font-bold uppercase hover:bg-[#C72A09] transition-colors shadow-[3px_3px_0px_#C72A09]"
                >
                  + NEW DESTINATION
                </button>
              </div>

              {loadingAddresses ? (
                <div className="font-mono text-xs text-gray-500 p-8 text-center">Loading addresses...</div>
              ) : addresses.length === 0 ? (
                <div className="p-8 border border-dashed border-[#1B0E0D] text-center">
                  <p className="font-mono text-xs text-gray-600 mb-4">No shipping destinations registered.</p>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="px-4 py-2 bg-[#1B0E0D] text-[#E3E2DE] font-mono text-xs uppercase"
                  >
                    Add Address Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="border border-[#1B0E0D] p-4 bg-[#E3E2DE]/30 relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-xs font-black uppercase tracking-wider text-[#C72A09]">
                            {addr.label}
                          </span>
                          {addr.is_default_shipping && (
                            <span className="px-1.5 py-0.5 bg-[#31EF07] text-[#1B0E0D] font-mono text-[10px] font-bold uppercase">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="font-clash text-base font-bold uppercase text-[#1B0E0D]">
                          {addr.recipient_name}
                        </p>
                        <p className="font-mono text-xs text-gray-700 leading-relaxed mt-1">
                          {addr.address_line1}
                          {addr.address_line2 && <br />}
                          {addr.address_line2}
                          <br />
                          {addr.city}, {addr.state_province} {addr.postal_code}
                          <br />
                          {addr.country_code} — {addr.phone}
                        </p>
                      </div>

                      <div className="border-t border-gray-300 pt-3 mt-4 flex justify-end">
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="font-mono text-xs text-[#C72A09] hover:underline uppercase font-bold"
                        >
                          PURGE DESTINATION
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Address Modal */}
              {showAddressModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/75 backdrop-blur-sm animate-fade-in">
                  <div className="w-full max-w-lg bg-[#E3E2DE] border-2 border-[#1B0E0D] shadow-[8px_8px_0px_#1B0E0D] p-6 text-[#1B0E0D]">
                    <div className="flex justify-between items-center border-b border-[#1B0E0D] pb-3 mb-4">
                      <h3 className="font-clash text-xl font-bold uppercase">ADD SHIPPING DESTINATION</h3>
                      <button
                        onClick={() => setShowAddressModal(false)}
                        className="font-mono font-bold hover:text-[#C72A09]"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleCreateAddress} className="space-y-3 font-mono text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block uppercase font-bold mb-1">LABEL</label>
                          <input
                            type="text"
                            required
                            value={addressLabel}
                            onChange={(e) => setAddressLabel(e.target.value)}
                            placeholder="Home / Atelier"
                            className="w-full bg-white border border-[#1B0E0D] p-2"
                          />
                        </div>
                        <div>
                          <label className="block uppercase font-bold mb-1">RECIPIENT NAME *</label>
                          <input
                            type="text"
                            required
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            className="w-full bg-white border border-[#1B0E0D] p-2"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block uppercase font-bold mb-1">STREET ADDRESS *</label>
                        <input
                          type="text"
                          required
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          placeholder="742 Brutalist Way"
                          className="w-full bg-white border border-[#1B0E0D] p-2"
                        />
                      </div>

                      <div>
                        <label className="block uppercase font-bold mb-1">APARTMENT, SUITE, ETC.</label>
                        <input
                          type="text"
                          value={addressLine2}
                          onChange={(e) => setAddressLine2(e.target.value)}
                          placeholder="Floor 4, Suite 402"
                          className="w-full bg-white border border-[#1B0E0D] p-2"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block uppercase font-bold mb-1">CITY *</label>
                          <input
                            type="text"
                            required
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full bg-white border border-[#1B0E0D] p-2"
                          />
                        </div>
                        <div>
                          <label className="block uppercase font-bold mb-1">STATE / PROV *</label>
                          <input
                            type="text"
                            required
                            value={stateProvince}
                            onChange={(e) => setStateProvince(e.target.value)}
                            className="w-full bg-white border border-[#1B0E0D] p-2"
                          />
                        </div>
                        <div>
                          <label className="block uppercase font-bold mb-1">POSTAL CODE *</label>
                          <input
                            type="text"
                            required
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            className="w-full bg-white border border-[#1B0E0D] p-2"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block uppercase font-bold mb-1">PHONE NUMBER *</label>
                          <input
                            type="tel"
                            required
                            value={addressPhone}
                            onChange={(e) => setAddressPhone(e.target.value)}
                            className="w-full bg-white border border-[#1B0E0D] p-2"
                          />
                        </div>
                        <div>
                          <label className="block uppercase font-bold mb-1">COUNTRY CODE *</label>
                          <input
                            type="text"
                            maxLength={2}
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                            className="w-full bg-white border border-[#1B0E0D] p-2"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer font-bold">
                          <input
                            type="checkbox"
                            checked={isDefaultShipping}
                            onChange={(e) => setIsDefaultShipping(e.target.checked)}
                            className="accent-[#1B0E0D]"
                          />
                          SET AS DEFAULT SHIPPING DESTINATION
                        </label>
                      </div>

                      <div className="border-t border-[#1B0E0D] pt-3 mt-4 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddressModal(false)}
                          className="px-4 py-2 border border-[#1B0E0D] font-bold"
                        >
                          CANCEL
                        </button>
                        <button
                          type="submit"
                          disabled={savingAddress}
                          className="px-5 py-2 bg-[#1B0E0D] text-[#E3E2DE] font-clash font-bold uppercase hover:bg-[#C72A09] transition-colors"
                        >
                          {savingAddress ? 'SAVING...' : 'REGISTER ADDRESS →'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === 'SECURITY' && (
            <div>
              <div className="border-b border-[#1B0E0D] pb-3 mb-6">
                <span className="font-mono text-[10px] tracking-widest text-[#C72A09] font-bold block uppercase">
                  SECTION [04]
                </span>
                <h2 className="font-clash text-2xl font-black uppercase">SECURITY & VERIFICATION PROTOCOLS</h2>
              </div>

              {resendStatus && (
                <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-600 text-amber-900 font-mono text-xs">
                  {resendStatus}
                </div>
              )}
              {resendHint && (
                <div className="mb-4 p-3 bg-green-50 border border-green-400 font-mono text-xs text-green-950 break-all">
                  <span className="font-bold block">[TEST NOTIFICATION] Token:</span>
                  <code>{resendHint}</code>
                </div>
              )}

              <div className="space-y-6">
                <div className="p-4 border border-[#1B0E0D] bg-[#E3E2DE]/30">
                  <h3 className="font-clash text-lg font-bold uppercase mb-1">EMAIL IDENTIFIER VERIFICATION</h3>
                  <p className="font-mono text-xs text-gray-700 leading-relaxed mb-4">
                    Status: {user.is_verified ? 'VERIFIED (100% PROTOCOL INTEGRITY)' : 'UNVERIFIED (PENDING DISPATCH)'}
                  </p>
                  {!user.is_verified && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleResendVerification}
                        className="px-4 py-2 border border-[#1B0E0D] bg-white font-mono text-xs font-bold uppercase hover:bg-[#1B0E0D] hover:text-[#E3E2DE] transition-colors"
                      >
                        DISPATCH NEW VERIFICATION EMAIL
                      </button>
                      <button
                        onClick={() => openAuthModal('VERIFY')}
                        className="px-4 py-2 bg-[#C72A09] text-white font-mono text-xs font-bold uppercase hover:bg-[#1B0E0D] transition-colors"
                      >
                        SUBMIT TOKEN CIPHER
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 border border-[#1B0E0D] bg-[#E3E2DE]/30">
                  <h3 className="font-clash text-lg font-bold uppercase mb-1">CIPHER (PASSWORD) RECOVERY</h3>
                  <p className="font-mono text-xs text-gray-700 leading-relaxed mb-4">
                    Passwords are salted and hashed using bcrypt (cost 10). If you wish to rotate your credentials, trigger a password reset workflow.
                  </p>
                  <button
                    onClick={() => openAuthModal('FORGOT')}
                    className="px-4 py-2 bg-[#1B0E0D] text-[#E3E2DE] font-clash text-xs font-bold uppercase hover:bg-[#C72A09] transition-colors"
                  >
                    INITIATE CIPHER ROTATION →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
