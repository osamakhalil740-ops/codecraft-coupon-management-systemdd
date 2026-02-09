
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ReferralHandlerPage: React.FC = () => {
    const { shopId } = useParams<{ shopId: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        if (shopId) {
            localStorage.setItem('referralId', shopId);
        }
        navigate('/login');
    }, [shopId, navigate]);

    return (
        <div className="text-center p-10">
            <p>Processing your referral link...</p>
        </div>
    );
};

export default ReferralHandlerPage;
