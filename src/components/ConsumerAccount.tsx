import React from 'react';
import { CustomerPortal } from './CustomerPortal';

// Backward-compatibility wrapper for ConsumerAccount
export const ConsumerAccount: React.FC = () => {
  return <CustomerPortal />;
};

export default ConsumerAccount;
