"use client";

import QRCode from "react-qr-code";

interface GenerateQRProps {
  qrData: string;
}

const username = "0000786"


const GenerateQRManual: React.FC<GenerateQRProps> = () => {
    
     const qrString = `${username}`;
  return (
    <div className="flex flex-col items-center justify-center p-4">
      
      <div className="bg-white p-4">
        <QRCode value={qrString} size={50} />
      </div>
    </div>
  );
};

export default GenerateQRManual;
