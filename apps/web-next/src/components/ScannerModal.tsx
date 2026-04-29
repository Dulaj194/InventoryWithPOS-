'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export default function ScannerModal({ isOpen, onClose, onScan }: ScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is rendered
      const timer = setTimeout(() => {
        try {
          scannerRef.current = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
          );

          scannerRef.current.render(
            (decodedText) => {
              onScan(decodedText);
              stopScanner();
              onClose();
            },
            (errorMessage) => {
              // Ignore scan errors as they happen constantly during detection
            }
          );
        } catch (err) {
          setError('Camera access denied or not available');
          console.error(err);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }
  }, [isOpen]);

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      scannerRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content scanner-modal">
        <div className="modal-header">
          <h3>Barcode / QR Scanner</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div id="qr-reader" style={{ width: '100%' }}></div>
          )}
          <p className="scanner-hint">Point your camera at a barcode or QR code</p>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }
        .modal-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 1.2rem;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }
        .modal-body {
          padding: 1.5rem;
          text-align: center;
        }
        .scanner-hint {
          margin-top: 1rem;
          color: #666;
          font-size: 0.9rem;
        }
        .error-message {
          color: #ef4444;
          padding: 2rem;
          background: #fef2f2;
          border-radius: 8px;
        }
        #qr-reader__dashboard_section_csr button {
          background: #154d71 !important;
          color: white !important;
          border: none !important;
          padding: 0.5rem 1rem !important;
          border-radius: 6px !important;
          cursor: pointer !important;
        }
      `}</style>
    </div>
  );
}
