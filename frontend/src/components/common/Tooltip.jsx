import React, { useState } from 'react';

export const Tooltip = ({ children, text, position = 'top' }) => {
  const [show, setShow] = useState(false);

  const posClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && text && (
        <div
          className={`absolute z-50 px-2.5 py-1.5 text-xs text-slate-100 bg-slate-900 border border-slate-700/80 rounded-lg shadow-xl whitespace-nowrap pointer-events-none ${posClasses[position]}`}
        >
          {text}
        </div>
      )}
    </div>
  );
};
