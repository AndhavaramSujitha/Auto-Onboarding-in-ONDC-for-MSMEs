import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Loader2 } from 'lucide-react';
export const Spinner = ({ size = 'md', className = '', }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-10 h-10',
    };
    return (_jsx("div", { className: `flex items-center justify-center p-4 ${className}`, children: _jsx(Loader2, { className: `${sizes[size]} animate-spin text-indigo-600` }) }));
};
export default Spinner;
