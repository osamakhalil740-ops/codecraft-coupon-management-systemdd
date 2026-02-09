
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { useTranslation } from '../hooks/useTranslation';

const ProfilePage: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const { t } = useTranslation();
    
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [category, setCategory] = useState('');
    const [shopDescription, setShopDescription] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [state, setState] = useState('');
    const [postalCode, setPostalCode] = useState('');

    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setCountry(user.country || '');
            setCity(user.city || '');
            setCategory(user.category || '');
            setShopDescription(user.shopDescription || '');
            setAddressLine1(user.addressLine1 || '');
            setAddressLine2(user.addressLine2 || '');
            setState(user.state || '');
            setPostalCode(user.postalCode || '');
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            await api.updateShopProfile(user.id, { 
                country, 
                city, 
                category,
                shopDescription,
                addressLine1,
                addressLine2,
                state,
                postalCode,
            });
            await refreshUser();
            setSuccessMessage(t('profilePage.successMessage'));
        } catch (err) {
            setError('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div>{t('common.loading')}</div>
    }

    return (
        <div className="max-w-2xl mx-auto animate-fadeIn">
            <h1 className="text-3xl font-bold text-dark-gray mb-2">{t('profilePage.title')}</h1>
            <p className="text-gray-600 mb-8">{t('profilePage.subtitle')}</p>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg border space-y-6">
                 <div>
                    <label htmlFor="shopDescription" className="block text-sm font-medium text-gray-700">{t('profilePage.shopDescriptionLabel')}</label>
                    <textarea id="shopDescription" value={shopDescription} onChange={e => setShopDescription(e.target.value)} rows={3} className="mt-1 block w-full form-textarea" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">{t('profilePage.categoryLabel')}</label>
                        <input type="text" id="category" value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full form-input" />
                    </div>
                     <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700">{t('profilePage.countryLabel')}</label>
                        <input type="text" id="country" value={country} onChange={e => setCountry(e.target.value)} className="mt-1 block w-full form-input" />
                    </div>
                </div>

                <div>
                    <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">{t('profilePage.addressLine1Label')}</label>
                    <input type="text" id="addressLine1" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} className="mt-1 block w-full form-input" />
                </div>
                 <div>
                    <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700">{t('profilePage.addressLine2Label')} <span className="text-gray-500">({t('common.optional')})</span></label>
                    <input type="text" id="addressLine2" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} className="mt-1 block w-full form-input" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">{t('profilePage.cityLabel')}</label>
                        <input type="text" id="city" value={city} onChange={e => setCity(e.target.value)} className="mt-1 block w-full form-input" />
                    </div>
                    <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">{t('profilePage.stateLabel')}</label>
                        <input type="text" id="state" value={state} onChange={e => setState(e.target.value)} className="mt-1 block w-full form-input" />
                    </div>
                     <div>
                        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">{t('profilePage.postalCodeLabel')}</label>
                        <input type="text" id="postalCode" value={postalCode} onChange={e => setPostalCode(e.target.value)} className="mt-1 block w-full form-input" />
                    </div>
                </div>
                
                {error && <p className="text-alert text-sm">{error}</p>}
                {successMessage && <p className="text-success text-sm">{successMessage}</p>}
                
                <div>
                    <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-md hover:shadow-lg transform hover:scale-105">
                        {loading ? t('profilePage.updating') : t('profilePage.updateButton')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfilePage;