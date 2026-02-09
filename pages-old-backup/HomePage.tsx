
import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { SparklesIcon, ShareIcon, RocketLaunchIcon, MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const CouponGenerator: React.FC = memo(() => {
    const { t } = useTranslation();
    return (
        <div className="glass-panel max-w-xl mt-10 w-full animate-slideInUp">
            <div className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-dark-gray mb-6 text-center">{t('home.generator.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder={t('home.generator.placeholder1')} className="w-full form-input py-3" />
                    <input type="text" placeholder={t('home.generator.placeholder2')} className="w-full form-input py-3" />
                </div>
                <Link
                    to="/login"
                    className="btn-primary w-full mt-6 inline-flex justify-center"
                >
                    {t('home.generator.button')}
                </Link>
            </div>
        </div>
    );
});

CouponGenerator.displayName = 'CouponGenerator';

const HomePage: React.FC = () => {
    const { t } = useTranslation();

    const metrics = useMemo(() => [
        { label: t('home.metrics.shops'), value: '3,200+' },
        { label: t('home.metrics.coupons'), value: '12,500+' },
        { label: t('home.metrics.redemptions'), value: '57,800+' },
    ], [t]);

    const benefits = useMemo(() => [
        {
            icon: <SparklesIcon className="h-6 w-6" />,
            title: t('home.benefits.items.0.title'),
            description: t('home.benefits.items.0.description'),
        },
        {
            icon: <ShareIcon className="h-6 w-6" />,
            title: t('home.benefits.items.1.title'),
            description: t('home.benefits.items.1.description'),
        },
        {
            icon: <RocketLaunchIcon className="h-6 w-6" />,
            title: t('home.benefits.items.2.title'),
            description: t('home.benefits.items.2.description'),
        },
    ], [t]);

    const steps = useMemo(() => [
        {
            title: t('home.howItWorks.step1.title'),
            description: t('home.howItWorks.step1.description'),
        },
        {
            title: t('home.howItWorks.step2.title'),
            description: t('home.howItWorks.step2.description'),
        },
        {
            title: t('home.howItWorks.step3.title'),
            description: t('home.howItWorks.step3.description'),
        },
    ], [t]);

    return (
        <div className="space-y-16 animate-fadeIn">
            <section className="homepage-hero relative overflow-hidden rounded-3xl text-white px-6 py-14 md:px-12">
                <div className="homepage-hero-content relative z-10 max-w-3xl">
                    <span className="homepage-hero-badge mb-6">{t('home.hero.badge')}</span>
                    <h1 className="homepage-hero-title">
                        {t('home.hero.title')}
                    </h1>
                    <p className="homepage-hero-subtitle">
                        {t('home.hero.subtitle')}
                    </p>
                    <div className="homepage-hero-buttons mt-8">
                        <Link to="/login" className="btn-primary">
                            {t('home.hero.primaryCta')}
                        </Link>
                        <Link to="/marketplace" className="btn-secondary">
                            {t('home.hero.secondaryCta')}
                        </Link>
                        <Link to="/locations" className="btn-secondary bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90" style={{ color: 'white' }}>
                            🌍 Browse by Location
                        </Link>
                    </div>
                </div>
            </section>

            {/* CRITICAL: Choose Your Path - TOP PRIORITY SECTION - Moved to top */}
            <section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-10 mb-8 shadow-xl border border-indigo-200">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-800 mb-4">{t('home.chooseYourPath.title')}</h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        {t('home.chooseYourPath.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    {/* Shop Owner Path */}
                    <div className="homepage-path-card blue">
                        <div className="text-center">
                            <div className="homepage-icon-container bg-blue-100">
                                <span>🏪</span>
                            </div>
                            <h3 className="text-2xl font-bold text-blue-800 mb-4">{t('home.chooseYourPath.shopOwner.title')}</h3>
                            <p className="text-base text-gray-600 mb-6">
                                {t('home.chooseYourPath.shopOwner.description')}
                            </p>
                            <ul className="text-sm text-gray-600 space-y-2 mb-8 text-left">
                                <li>✓ {t('home.chooseYourPath.shopOwner.features.0')}</li>
                                <li>✓ {t('home.chooseYourPath.shopOwner.features.1')}</li>
                                <li>✓ {t('home.chooseYourPath.shopOwner.features.2')}</li>
                                <li>✓ {t('home.chooseYourPath.shopOwner.features.3')}</li>
                                <li>✓ {t('home.chooseYourPath.shopOwner.features.4')}</li>
                            </ul>
                            <Link 
                                to="/login?role=shop-owner"
                                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-bold hover:bg-blue-700 transition-colors inline-block text-center text-lg"
                            >
                                {t('home.chooseYourPath.shopOwner.cta')}
                            </Link>
                        </div>
                    </div>

                    {/* Affiliate Path */}
                    <div className="homepage-path-card green">
                        <div className="text-center">
                            <div className="homepage-icon-container bg-green-100">
                                <span>📈</span>
                            </div>
                            <h3 className="text-2xl font-bold text-green-800 mb-4">{t('home.chooseYourPath.affiliate.title')}</h3>
                            <p className="text-base text-gray-600 mb-6">
                                {t('home.chooseYourPath.affiliate.description')}
                            </p>
                            <ul className="text-sm text-gray-600 space-y-2 mb-8 text-left">
                                <li>✓ {t('home.chooseYourPath.affiliate.features.0')}</li>
                                <li>✓ {t('home.chooseYourPath.affiliate.features.1')}</li>
                                <li>✓ {t('home.chooseYourPath.affiliate.features.2')}</li>
                                <li>✓ {t('home.chooseYourPath.affiliate.features.3')}</li>
                                <li>✓ {t('home.chooseYourPath.affiliate.features.4')}</li>
                            </ul>
                            <Link 
                                to="/login?role=affiliate"
                                className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-bold hover:bg-green-700 transition-colors inline-block text-center text-lg"
                            >
                                {t('home.chooseYourPath.affiliate.cta')}
                            </Link>
                        </div>
                    </div>

                    {/* Customer Path */}
                    <div className="homepage-path-card purple">
                        <div className="text-center">
                            <div className="homepage-icon-container bg-purple-100">
                                <span>🎁</span>
                            </div>
                            <h3 className="text-2xl font-bold text-purple-800 mb-4">{t('home.chooseYourPath.customer.title')}</h3>
                            <p className="text-base text-gray-600 mb-6">
                                {t('home.chooseYourPath.customer.description')}
                            </p>
                            <ul className="text-sm text-gray-600 space-y-2 mb-8 text-left">
                                <li>✓ {t('home.chooseYourPath.customer.features.0')}</li>
                                <li>✓ {t('home.chooseYourPath.customer.features.1')}</li>
                                <li>✓ {t('home.chooseYourPath.customer.features.2')}</li>
                                <li>✓ {t('home.chooseYourPath.customer.features.3')}</li>
                                <li>✓ {t('home.chooseYourPath.customer.features.4')}</li>
                            </ul>
                            <Link 
                                to="/marketplace"
                                className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg font-bold hover:bg-purple-700 transition-colors inline-block text-center text-lg"
                            >
                                {t('home.chooseYourPath.customer.cta')}
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12">
                    <div className="inline-flex items-center gap-4 bg-white px-8 py-4 rounded-full shadow-lg border border-gray-200">
                        <span className="text-sm font-medium text-gray-600">{t('home.chooseYourPath.newUser')}</span>
                        <Link 
                            to="/login" 
                            className="text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-all"
                        >
                            {t('home.chooseYourPath.getStarted')}
                        </Link>
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#051937] via-[#0f62ff] to-[#7de2fc] text-white px-6 py-14 md:px-12">
                <div className="blur-blob -right-10 top-10" />
                <div className="blur-blob -left-12 bottom-0" />
                <div className="relative z-10 max-w-3xl">
                    <CouponGenerator />
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {metrics.map((metric) => (
                            <div key={metric.label} className="homepage-metric">
                                <span className="homepage-metric-value">{metric.value}</span>
                                <span className="homepage-metric-label">{metric.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* NEW: Global Location Coverage Section */}
            <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-10 md:p-16">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                        {t('home.globalCoverage.title')}
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        {t('home.globalCoverage.subtitle')}
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="homepage-coverage-stat">
                        <div className="inline-flex p-4 rounded-full bg-blue-100 text-blue-600 mb-4">
                            <GlobeAltIcon className="h-8 w-8" />
                        </div>
                        <div className="text-4xl font-bold text-gray-800 mb-2">195+</div>
                        <div className="text-gray-600 font-medium">{t('home.globalCoverage.countries')}</div>
                    </div>
                    <div className="homepage-coverage-stat">
                        <div className="inline-flex p-4 rounded-full bg-purple-100 text-purple-600 mb-4">
                            <MapPinIcon className="h-8 w-8" />
                        </div>
                        <div className="text-4xl font-bold text-gray-800 mb-2">4M+</div>
                        <div className="text-gray-600 font-medium">{t('home.globalCoverage.cities')}</div>
                    </div>
                    <div className="homepage-coverage-stat">
                        <div className="inline-flex p-4 rounded-full bg-pink-100 text-pink-600 mb-4">
                            <MapPinIcon className="h-8 w-8" />
                        </div>
                        <div className="text-4xl font-bold text-gray-800 mb-2">∞</div>
                        <div className="text-gray-600 font-medium">{t('home.globalCoverage.areas')}</div>
                    </div>
                </div>
                
                <div className="text-center">
                    <Link 
                        to="/locations" 
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                    >
                        <MapPinIcon className="h-6 w-6" />
                        {t('home.globalCoverage.exploreButton')}
                    </Link>
                </div>
                
            </section>

            <section className="space-y-12">
                <div className="text-center max-w-3xl mx-auto">
                    <p className="hero-pill mx-auto mb-4 text-sm text-primary/90 bg-primary/5 border-primary/20">
                        {t('home.benefits.title')}
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold text-dark-gray">
                        {t('home.benefits.description')}
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {benefits.map((benefit) => (
                        <div key={benefit.title} className="homepage-benefit-card">
                            <div className="homepage-benefit-icon">{benefit.icon}</div>
                            <h3 className="text-xl font-semibold text-dark-gray mb-3">{benefit.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="glass-panel p-8 md:p-12">
                <div className="grid gap-10 md:grid-cols-2 items-center">
                    <div>
                        <p className="hero-pill text-sm text-primary/90 bg-primary/5 border-primary/20 inline-flex mb-4">
                            {t('home.howItWorks.title')}
                        </p>
                        <h3 className="text-3xl font-bold text-dark-gray mb-4">
                            {t('home.workflow.title')}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            {t('home.workflow.description')}
                        </p>
                    </div>
                    <div className="space-y-6">
                        {steps.map((step, index) => (
                            <div key={step.title} className="homepage-step">
                                <div className="homepage-step-number">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-semibold text-lg text-dark-gray mb-2">{step.title}</p>
                                    <p className="text-gray-600">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            <section className="homepage-cta-section">
                <p className="hero-pill mx-auto mb-4 text-sm text-primary/90 bg-primary/5 border-primary/20">
                    {t('home.ctaSection.highlight')}
                </p>
                <h3 className="homepage-section-title mb-4">{t('home.ctaSection.title')}</h3>
                <p className="homepage-section-subtitle mx-auto mb-6">{t('home.ctaSection.subtitle')}</p>
                <div className="flex flex-wrap gap-4 justify-center mt-8">
                    <Link to="/login" className="btn-primary">
                        {t('home.ctaSection.primary')}
                    </Link>
                    <Link to="/partner-with-us" className="btn-secondary dark">
                        {t('home.ctaSection.secondary')}
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default HomePage;