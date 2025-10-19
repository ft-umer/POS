"use client";

import QRCode from "react-qr-code";

interface GenerateQRProps {
  qrData: string;
}

const GenerateQR: React.FC<GenerateQRProps> = ({ qrData }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      
      <div className="bg-white p-4">
        <QRCode value={qrData} size={50} />
      </div>
    </div>
  );
};

export default GenerateQR;
