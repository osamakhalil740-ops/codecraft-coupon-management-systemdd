import React, { useEffect, useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface SuccessAnimationProps {
  message?: string;
  onComplete?: () => void;
  duration?: number;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  message = 'Success!',
  onComplete,
  duration = 2000
}) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-2xl p-8 shadow-2xl animate-scaleIn">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <CheckCircleIcon className="h-20 w-20 text-green-500 animate-bounce" />
            <div className="absolute inset-0 bg-green-500 rounded-full opacity-25 animate-ping"></div>
          </div>
          <p className="text-xl font-semibold text-gray-900">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default SuccessAnimation;
