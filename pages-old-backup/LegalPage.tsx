import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const LegalPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md border">
            <h1 className="text-3xl font-bold mb-6">{t('legal.title')}</h1>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-3">{t('legal.terms.title')}</h2>
                <p className="text-gray-600">
                    {t('legal.terms.description')}
                </p>
            </section>
            
            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-3">{t('legal.privacy.title')}</h2>
                <p className="text-gray-600">
                    {t('legal.privacy.description')}
                </p>
            </section>
            
             <section>
                <h2 className="text-2xl font-semibold mb-3">{t('legal.cookies.title')}</h2>
                <p className="text-gray-600">
                    {t('legal.cookies.description')}
                </p>
            </section>
        </div>
    );
};

export default LegalPage;
