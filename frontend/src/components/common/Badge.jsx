import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export const Badge = ({ children, variant = 'neutral', size = 'md', dot = false, className = '', }) => {
    const styles = {
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
        warning: 'bg-amber-50 text-amber-700 border-amber-200/60',
        error: 'bg-red-50 text-red-700 border-red-200/60',
        info: 'bg-sky-50 text-sky-700 border-sky-200/60',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
        neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    const dotColors = {
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        error: 'bg-red-500',
        info: 'bg-sky-500',
        indigo: 'bg-indigo-500',
        neutral: 'bg-slate-400',
    };
    const sizes = {
        sm: 'text-[11px] px-2 py-0.5 font-medium',
        md: 'text-xs px-2.5 py-1 font-medium',
    };
    return (_jsxs("span", { className: `inline-flex items-center gap-1.5 rounded-full border ${styles[variant]} ${sizes[size]} ${className}`, children: [dot && _jsx("span", { className: `w-1.5 h-1.5 rounded-full ${dotColors[variant]}` }), children] }));
};
export default Badge;
