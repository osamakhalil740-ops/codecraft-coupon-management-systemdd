import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-extrabold text-primary">404</h1>
      <h2 className="text-3xl font-bold text-gray-800 mt-4 mb-2">{t('notFound.title')}</h2>
      <p className="text-gray-600 mb-6">
        {t('notFound.description')}
      </p>
      <Link
        to="/"
        className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-colors"
      >
        {t('notFound.goHome')}
      </Link>
    </div>
  );
};

export default NotFoundPage;
