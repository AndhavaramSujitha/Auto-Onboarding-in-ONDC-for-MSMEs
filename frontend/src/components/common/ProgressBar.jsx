import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export const ProgressBar = ({ value, color = 'indigo', size = 'md', showLabel = false, label, className = '', }) => {
    const clamped = Math.min(100, Math.max(0, value));
    const heights = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4',
    };
    const barColors = {
        indigo: 'bg-indigo-600',
        emerald: 'bg-emerald-600',
        amber: 'bg-amber-500',
        blue: 'bg-blue-600',
    };
    return (_jsxs("div", { className: `w-full ${className}`, children: [(showLabel || label) && (_jsxs("div", { className: "flex justify-between items-center mb-1.5 text-xs font-medium text-slate-700", children: [_jsx("span", { children: label || 'Progress' }), _jsxs("span", { children: [clamped, "%"] })] })), _jsx("div", { className: `w-full bg-slate-100 rounded-full overflow-hidden ${heights[size]}`, children: _jsx("div", { className: `${barColors[color]} h-full rounded-full transition-all duration-500 ease-out`, style: { width: `${clamped}%` } }) })] }));
};
export default ProgressBar;
