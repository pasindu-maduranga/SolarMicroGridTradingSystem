import React from "react";

export default function FactoryLogo({ height = '80px', offsetX = '-12px' }) {
  return (
    <div
      style={{
        textAlign: 'center',
        width: '100%',
        marginBottom: '8px',
      }}
    >
      <img
        src={`${process.env.PUBLIC_URL}/static/images/FactoryLogo.png`}
        alt="Company Logo"
        style={{
          height: height,
          objectFit: 'contain',
          display: 'inline-block',
          transform: `translateX(${offsetX})`,
        }}
      />
    </div>
  );
}
