import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { callNextToken, markCompleted, markNoShow } from '../../utils/queueManager';
import toast from 'react-hot-toast';

const QueueControl = () => {
    const { userProfile } = useAuth();
    const [queues, setQueues] = useState([]);
    const [services, setServices] = useState({});
    const [selectedQueue, setSelectedQueue] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userProfile?.organizationId) return;

        // Fetch services first
        fetchServices();

        // Real-time listener for today's queues
        const today = new Date().toISOString().split('T')[0];
        const q = query(
            collection(db, 'queues'),
            where('organizationId', '==', userProfile.organizationId),
            where('date', '==', today),
            where('isActive', '==', true)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const queueData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setQueues(queueData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile]);

    const fetchServices = async () => {
        try {
            const servicesQuery = query(
                collection(db, 'services'),
                where('organizationId', '==', userProfile.organizationId)
            );
            const servicesSnapshot = await getDocs(servicesQuery);
            const servicesMap = {};
            servicesSnapshot.docs.forEach(doc => {
                servicesMap[doc.id] = doc.data().name;
            });
            setServices(servicesMap);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const handleCallNext = async (queueId) => {
        const result = await callNextToken(queueId);
        if (result.success) {
            toast.success('Next token called!');
        } else {
            toast.error(result.error || 'Failed to call next token');
        }
    };

    const handleMarkCompleted = async (queueId, appointmentId) => {
        const result = await markCompleted(queueId, appointmentId);
        if (result.success) {
            toast.success('Service marked as completed');
        } else {
            toast.error(result.error || 'Failed to mark completed');
        }
    };

    const handleMarkNoShow = async (queueId, appointmentId) => {
        const result = await markNoShow(queueId, appointmentId);
        if (result.success) {
            toast.success('Marked as no-show');
        } else {
            toast.error(result.error || 'Failed to mark no-show');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading queues...</p>
            </div>
        );
    }

    return (
        <div className="container fade-in" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <h1 className="gradient-text">🎫 Queue Control</h1>
            <p>Manage today's queues and call customers</p>

            {queues.length === 0 ? (
                <div className="card text-center">
                    <p>No active queues for today</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {queues.map(queue => (
                        <div key={queue.id} className="card">
                            <div className="card-header">
                                <h3 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>
                                    {services[queue.serviceId] || 'Loading...'}
                                </h3>
                                <div style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    fontSize: '0.875rem',
                                    flexWrap: 'wrap'
                                }}>
                                    <span>👥 Active: {queue.activeTokens.length}</span>
                                    <span>✅ Completed: {queue.completedTokens.length}</span>
                                    <span>❌ No-shows: {queue.noShowTokens.length}</span>
                                </div>
                            </div>

                            <div className="card-body">
                                {queue.currentToken ? (
                                    <div style={{
                                        padding: '1rem',
                                        background: 'var(--success-gradient)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'white',
                                        marginBottom: '1rem'
                                    }}>
                                        <h4>Currently Serving</h4>
                                        <p>Token: {queue.currentToken}</p>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                            <button
                                                className="btn-primary touch-target"
                                                onClick={() => handleMarkCompleted(queue.id, queue.currentToken)}
                                                style={{ flex: '1', minWidth: '120px' }}
                                            >
                                                Mark Completed
                                            </button>
                                            <button
                                                className="btn-danger touch-target"
                                                onClick={() => handleMarkNoShow(queue.id, queue.currentToken)}
                                                style={{ flex: '1', minWidth: '120px' }}
                                            >
                                                Mark No-Show
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        padding: '1rem',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: '1rem'
                                    }}>
                                        <p>No customer currently being served</p>
                                    </div>
                                )}

                                {queue.activeTokens.length > 0 && (
                                    <>
                                        <h4>Waiting Queue ({queue.activeTokens.length})</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {queue.activeTokens.slice(0, 5).map((token, index) => (
                                                <div
                                                    key={token}
                                                    style={{
                                                        padding: '0.75rem',
                                                        background: 'var(--bg-tertiary)',
                                                        borderRadius: 'var(--radius-md)',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <span>#{index + 1} - Token: {token.slice(-6)}</span>
                                                </div>
                                            ))}
                                            {queue.activeTokens.length > 5 && (
                                                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    +{queue.activeTokens.length - 5} more in queue
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="card-footer">
                                <button
                                    className="btn-primary touch-target"
                                    style={{ width: '100%' }}
                                    onClick={() => handleCallNext(queue.id)}
                                    disabled={queue.activeTokens.length === 0}
                                >
                                    Call Next Token
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QueueControl;
