import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

const AffiliateNetworkPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="text-center py-16 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-dark-gray mb-4">{t('affiliateNetwork.title')}</h1>
            <p className="text-lg text-gray-600 mb-8">
                {t('affiliateNetwork.subtitle')}
            </p>
            
            <div className="bg-white p-8 rounded-lg shadow border">
                 <h3 className="text-xl font-semibold text-primary mb-3">{t('affiliateNetwork.whyJoin.title')}</h3>
                 <p>
                    {t('affiliateNetwork.whyJoin.description')}
                 </p>
            </div>

            <div className="mt-10">
                <Link
                    to="/login"
                    className="inline-block bg-primary text-white font-bold py-3 px-10 rounded-lg hover:opacity-90 transition-transform transform hover:scale-105 shadow-lg"
                >
                    {t('affiliateNetwork.ctaButton')}
                </Link>
            </div>
        </div>
    );
};

export default AffiliateNetworkPage;
