import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';
import { addToQueue } from '../../utils/queueManager';

const QRScanner = () => {
    const { userProfile } = useAuth();
    const [qrCode, setQrCode] = useState('');
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanMode, setScanMode] = useState('manual'); // 'manual' or 'camera'
    const [scanning, setScanning] = useState(false);
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    useEffect(() => {
        return () => {
            // Cleanup scanner on unmount
            if (html5QrCodeRef.current && scanning) {
                html5QrCodeRef.current.stop().catch(err => console.error('Error stopping scanner:', err));
            }
        };
    }, [scanning]);

    const handleScan = async (scannedCode) => {
        if (!scannedCode.trim()) {
            toast.error('Please enter QR code');
            return;
        }

        setLoading(true);
        try {
            // Search for appointment with this QR code
            const appointmentsRef = collection(db, 'appointments');
            const q = query(appointmentsRef, where('qrCode', '==', scannedCode.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast.error('Invalid QR code');
                setAppointment(null);
                return;
            }

            const appointmentDoc = querySnapshot.docs[0];
            const appointmentData = { id: appointmentDoc.id, ...appointmentDoc.data() };

            // Validate organization
            if (appointmentData.organizationId !== userProfile.organizationId) {
                toast.error('This appointment is for a different organization');
                setAppointment(null);
                return;
            }

            // Validate date
            const today = new Date().toISOString().split('T')[0];
            if (appointmentData.appointmentDate !== today) {
                toast.error('This appointment is not for today');
                setAppointment(null);
                return;
            }

            setAppointment(appointmentData);
            toast.success('Appointment found!');

            // Stop camera if scanning
            if (scanning && html5QrCodeRef.current) {
                await html5QrCodeRef.current.stop();
                setScanning(false);
            }
        } catch (error) {
            console.error('Error scanning QR:', error);
            toast.error('Failed to scan QR code');
        } finally {
            setLoading(false);
        }
    };

    const startCameraScanner = async () => {
        try {
            // Wait for DOM element to be ready
            await new Promise(resolve => setTimeout(resolve, 100));

            const element = document.getElementById("qr-reader");
            if (!element) {
                toast.error('Camera element not found. Please try again.');
                setScanMode('manual');
                return;
            }

            const html5QrCode = new Html5Qrcode("qr-reader");
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" }, // Use back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    setQrCode(decodedText);
                    handleScan(decodedText);
                },
                (errorMessage) => {
                    // Ignore scanning errors (happens continuously)
                }
            );

            setScanning(true);
            toast.success('Camera started!');
        } catch (err) {
            console.error('Error starting camera:', err);
            toast.error('Failed to start camera. Please check permissions.');
            setScanMode('manual');
        }
    };

    const stopCameraScanner = async () => {
        if (html5QrCodeRef.current && scanning) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current = null;
                setScanning(false);
                toast.success('Camera stopped');
            } catch (err) {
                console.error('Error stopping camera:', err);
            }
        }
    };

    const toggleScanMode = async () => {
        if (scanMode === 'manual') {
            setScanMode('camera');
            // Start camera after state update
            setTimeout(() => startCameraScanner(), 100);
        } else {
            await stopCameraScanner();
            setScanMode('manual');
        }
    };

    const handleCheckIn = async () => {
        if (!appointment) return;

        try {
            // Update appointment status to CHECKED_IN
            await updateDoc(doc(db, 'appointments', appointment.id), {
                status: 'CHECKED_IN',
                updatedAt: serverTimestamp()
            });

            // Add customer to queue
            const queueResult = await addToQueue(
                appointment.id,
                appointment.organizationId,
                appointment.serviceId,
                appointment.appointmentDate
            );

            if (queueResult.success) {
                toast.success(`Customer checked in! Queue position: ${queueResult.position}`);
            } else {
                toast.warning('Checked in but failed to add to queue');
            }

            setQrCode('');
            setAppointment(null);
        } catch (error) {
            console.error('Error checking in:', error);
            toast.error('Failed to check in');
        }
    };

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <h1>QR Scanner</h1>
            <p>Scan customer QR codes to check them in</p>

            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="card-body">
                    {/* Mode Toggle */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <button
                            className={`${scanMode === 'manual' ? 'btn-primary' : 'btn-outline'} touch-target`}
                            onClick={() => scanMode === 'camera' && toggleScanMode()}
                            style={{ flex: 1, minWidth: '120px' }}
                        >
                            📝 Manual Input
                        </button>
                        <button
                            className={`${scanMode === 'camera' ? 'btn-primary' : 'btn-outline'} touch-target`}
                            onClick={toggleScanMode}
                            style={{ flex: 1, minWidth: '120px' }}
                        >
                            📷 Camera Scan
                        </button>
                    </div>

                    {scanMode === 'manual' ? (
                        <>
                            <div className="form-group">
                                <label htmlFor="qrCode">Enter QR Code</label>
                                <input
                                    type="text"
                                    id="qrCode"
                                    value={qrCode}
                                    onChange={(e) => setQrCode(e.target.value)}
                                    placeholder="Paste or type QR code here"
                                    disabled={loading}
                                />
                            </div>

                            <button
                                className="btn-primary touch-target"
                                onClick={() => handleScan(qrCode)}
                                disabled={loading}
                                style={{ width: '100%' }}
                            >
                                {loading ? 'Scanning...' : 'Scan QR Code'}
                            </button>
                        </>
                    ) : (
                        <div>
                            <div
                                id="qr-reader"
                                style={{
                                    width: '100%',
                                    borderRadius: 'var(--radius-md)',
                                    overflow: 'hidden'
                                }}
                            ></div>
                            {scanning && (
                                <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--success)' }}>
                                    📷 Camera is active. Point at QR code...
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {appointment && (
                    <>
                        <div className="card-body" style={{ borderTop: '1px solid var(--border)' }}>
                            <h3>Customer Details</h3>
                            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                                <p><strong>Name:</strong> {appointment.customerName}</p>
                                <p><strong>Phone:</strong> {appointment.customerPhone}</p>
                                <p><strong>Token:</strong> {appointment.tokenNumber}</p>
                                <p><strong>Time:</strong> {appointment.appointmentTime}</p>
                                <p><strong>Status:</strong> {appointment.status}</p>
                            </div>
                        </div>

                        <div className="card-footer">
                            <button
                                className="btn-success touch-target"
                                onClick={handleCheckIn}
                                style={{ width: '100%' }}
                                disabled={appointment.status !== 'BOOKED'}
                            >
                                Check In Customer
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default QRScanner;
