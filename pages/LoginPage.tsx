
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { LogoIcon } from '../components/icons/LogoIcon';
import { useTranslation } from '../hooks/useTranslation';
import { getAllCountries, getCitiesForCountryAsync, getDistrictsForCity } from '../utils/countryData';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // User/Affiliate fields
  const [name, setName] = useState('');
  
  // Shop Owner fields
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  
  // Dynamic location data
  const [availableCountries] = useState(getAllCountries());
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [referredBy, setReferredBy] = useState<string | null>(null);

  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    const referralId = localStorage.getItem('referralId');
    if (referralId) {
      setReferredBy(referralId);
      setIsLoginMode(false);
    }
    
    // Check for role parameter from home page navigation
    const urlParams = new URLSearchParams(location.search);
    const roleParam = urlParams.get('role');
    if (roleParam && ['shop-owner', 'affiliate', 'user'].includes(roleParam)) {
      setRole(roleParam as any);
      setIsLoginMode(false); // Start with signup if role is specified
    }
  }, [location]);

  // Handle country change
  useEffect(() => {
    if (country) {
      const loadCities = async () => {
        const cities = await getCitiesForCountryAsync(country);
        setAvailableCities(cities);
        setCity('');
        setDistrict('');
        setAvailableDistricts([]);
      };
      loadCities();
    } else {
      setAvailableCities([]);
    }
  }, [country]);

  // Handle city change
  useEffect(() => {
    if (country && city) {
      const districts = getDistrictsForCity(country, city);
      setAvailableDistricts(districts);
      setDistrict('');
    }
  }, [country, city]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        const finalName = role === 'shop-owner' ? shopName : name;
        const shopDetails = role === 'shop-owner' ? { category, country, city, district } : undefined;
        await signup(email, password, finalName, role, referredBy, shopDetails);
        localStorage.removeItem('referralId');
      }
      navigate(from || '/dashboard', { replace: !!from });
    } catch (err: any) {
       setError(err.message || 'An error occurred. Please try again.');
    } finally {
        setLoading(false);
    }
  };
  
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
  };

  const renderSignupFields = () => {
    if (role === 'shop-owner') {
      return (
        <>
          <div>
            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">{t('loginPage.shopNameLabel')}</label>
            <input type="text" id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} required className="mt-1 block w-full form-input" />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">{t('loginPage.categoryLabel')}</label>
            <input type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)} required className="mt-1 block w-full form-input" />
          </div>
           <div>
             <label htmlFor="country" className="block text-sm font-medium text-gray-700">{t('loginPage.countryLabel')}</label>
             <select id="country" value={country} onChange={(e) => setCountry(e.target.value)} required className="mt-1 block w-full form-select">
               <option value="">Select a country</option>
               {availableCountries.map((countryOption) => (
                 <option key={countryOption} value={countryOption}>{countryOption}</option>
               ))}
             </select>
           </div>
           
           {country && (
             <div>
               <label htmlFor="city" className="block text-sm font-medium text-gray-700">{t('loginPage.cityLabel')}</label>
               <select id="city" value={city} onChange={(e) => setCity(e.target.value)} required className="mt-1 block w-full form-select">
                 <option value="">Select a city</option>
                 {availableCities.map((cityOption) => (
                   <option key={cityOption} value={cityOption}>{cityOption}</option>
                 ))}
               </select>
             </div>
           )}
           
           {city && availableDistricts.length > 0 && (
             <div>
               <label htmlFor="district" className="block text-sm font-medium text-gray-700">District/Area</label>
               <select id="district" value={district} onChange={(e) => setDistrict(e.target.value)} className="mt-1 block w-full form-select">
                 <option value="">Select a district (optional)</option>
                 {availableDistricts.map((districtOption) => (
                   <option key={districtOption} value={districtOption}>{districtOption}</option>
                 ))}
               </select>
             </div>
           )}
        </>
      );
    }
    // Fields for User and Affiliate
    return (
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('loginPage.fullNameLabel')}</label>
        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full form-input" />
      </div>
    );
  };


  return (
    <div className="max-w-md mx-auto my-10 animate-fadeIn bg-gradient-to-br from-slate-50 to-gray-100 p-4 rounded-xl">
        <div className="flex justify-center mb-6">
            <LogoIcon className="h-12 w-12 text-primary" />
        </div>
      <div className="bg-white p-8 rounded-lg shadow-xl border">
        {referredBy && !isLoginMode && (
          <div className="bg-green-100 border-l-4 border-success text-green-700 p-4 mb-6 rounded-r-lg animate-fadeIn">
            <p className="font-bold">{t('loginPage.referredWelcome')}</p>
            <p dangerouslySetInnerHTML={{ __html: t('loginPage.referredMessage')}} />
          </div>
        )}
        <h2 className="text-2xl font-bold text-center text-dark-gray mb-2">
          {isLoginMode ? t('loginPage.welcomeBack') : t('loginPage.createAccount')}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
             <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">{t('loginPage.signupAsLabel')}</label>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="mt-1 block w-full form-select">
                  <option value="user">{t('loginPage.roleUser')}</option>
                  <option value="shop-owner">{t('loginPage.roleShopOwner')}</option>
                  <option value="affiliate">{t('loginPage.roleAffiliate')}</option>
                </select>
              </div>
           )}
          {!isLoginMode && renderSignupFields()}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('loginPage.emailLabel')}</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full form-input" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('loginPage.passwordLabel')}</label>
            <div className="relative mt-1">
                 <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full form-input" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                </button>
            </div>
          </div>
           
          {error && <p className="text-alert text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3 px-4 rounded-md hover:opacity-90 disabled:opacity-50 transition-all shadow-md hover:shadow-lg transform hover:scale-105">
            {loading ? t('loginPage.processing') : (isLoginMode ? t('loginPage.loginButton') : t('loginPage.createAccountButton'))}
          </button>
        </form>
         <p className="text-center text-sm text-gray-500 mt-6">
            {isLoginMode ? t('loginPage.dontHaveAccount') : t('loginPage.alreadyHaveAccount')}{' '}
            <button onClick={toggleMode} className="font-medium text-primary hover:underline">
              {isLoginMode ? t('loginPage.signUp') : t('loginPage.login')}
            </button>
          </p>
      </div>
    </div>
  );
};

export default LoginPage;