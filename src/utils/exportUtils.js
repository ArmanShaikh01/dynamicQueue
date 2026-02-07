import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export Utilities for Analytics and Reports
 */

/**
 * Export analytics data to Excel
 */
export const exportAnalyticsToExcel = (analyticsData, orgName) => {
    try {
        const wb = XLSX.utils.book_new();

        // Summary Sheet
        const summaryData = [
            ['Metric', 'Value'],
            ['Total Bookings', analyticsData.summary.totalBookings],
            ['Completed', analyticsData.summary.completed],
            ['Cancelled', analyticsData.summary.cancelled],
            ['No-Shows', analyticsData.summary.noShows],
            ['Pending', analyticsData.summary.pending],
            ['In Progress', analyticsData.summary.inProgress],
            ['Emergency Cases', analyticsData.summary.emergencyCases],
            ['Avg Waiting Time (min)', analyticsData.summary.avgWaitingTime]
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

        // Service-wise Sheet
        if (analyticsData.serviceWise && analyticsData.serviceWise.length > 0) {
            const serviceData = analyticsData.serviceWise.map(s => ({
                'Service Name': s.serviceName,
                'Total': s.total,
                'Completed': s.completed,
                'Cancelled': s.cancelled,
                'No-Shows': s.noShows,
                'Pending': s.pending
            }));
            const serviceSheet = XLSX.utils.json_to_sheet(serviceData);
            XLSX.utils.book_append_sheet(wb, serviceSheet, 'Service-wise');
        }

        // Staff-wise Sheet
        if (analyticsData.staffWise && analyticsData.staffWise.length > 0) {
            const staffData = analyticsData.staffWise.map(s => ({
                'Staff Name': s.staffName,
                'Total': s.total,
                'Completed': s.completed,
                'Cancelled': s.cancelled,
                'No-Shows': s.noShows,
                'Avg Waiting Time (min)': s.avgWaitingTime
            }));
            const staffSheet = XLSX.utils.json_to_sheet(staffData);
            XLSX.utils.book_append_sheet(wb, staffSheet, 'Staff-wise');
        }

        // Trends Sheet
        if (analyticsData.trends && analyticsData.trends.length > 0) {
            const trendsData = analyticsData.trends.map(t => ({
                'Date': t.date,
                'Total': t.total,
                'Completed': t.completed,
                'Cancelled': t.cancelled,
                'No-Shows': t.noShows,
                'Pending': t.pending
            }));
            const trendsSheet = XLSX.utils.json_to_sheet(trendsData);
            XLSX.utils.book_append_sheet(wb, trendsSheet, 'Trends');
        }

        // Cancellation Reasons Sheet
        if (analyticsData.cancellationReasons && Object.keys(analyticsData.cancellationReasons).length > 0) {
            const cancellationData = Object.entries(analyticsData.cancellationReasons).map(([reason, count]) => ({
                'Reason': reason,
                'Count': count
            }));
            const cancellationSheet = XLSX.utils.json_to_sheet(cancellationData);
            XLSX.utils.book_append_sheet(wb, cancellationSheet, 'Cancellation Reasons');
        }

        // No-Show Reasons Sheet
        if (analyticsData.noShowReasons && Object.keys(analyticsData.noShowReasons).length > 0) {
            const noShowData = Object.entries(analyticsData.noShowReasons).map(([reason, count]) => ({
                'Reason': reason,
                'Count': count
            }));
            const noShowSheet = XLSX.utils.json_to_sheet(noShowData);
            XLSX.utils.book_append_sheet(wb, noShowSheet, 'No-Show Reasons');
        }

        const filename = `Analytics_${orgName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
        XLSX.writeFile(wb, filename);

        return { success: true, filename };
    } catch (error) {
        console.error('Error exporting analytics to Excel:', error);
        return { success: false, error };
    }
};

/**
 * Export analytics to PDF
 */
export const exportAnalyticsToPDF = (analyticsData, orgName) => {
    try {
        const doc = new jsPDF();
        let yPos = 20;

        // Title
        doc.setFontSize(18);
        doc.text(`Analytics Report - ${orgName}`, 14, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
        yPos += 15;

        // Summary Section
        doc.setFontSize(14);
        doc.text('Summary', 14, yPos);
        yPos += 7;

        const summaryData = [
            ['Metric', 'Value'],
            ['Total Bookings', analyticsData.summary.totalBookings.toString()],
            ['Completed', analyticsData.summary.completed.toString()],
            ['Cancelled', analyticsData.summary.cancelled.toString()],
            ['No-Shows', analyticsData.summary.noShows.toString()],
            ['Pending', analyticsData.summary.pending.toString()],
            ['Emergency Cases', analyticsData.summary.emergencyCases.toString()],
            ['Avg Waiting Time', `${analyticsData.summary.avgWaitingTime} min`]
        ];

        autoTable(doc, {
            startY: yPos,
            head: [summaryData[0]],
            body: summaryData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [102, 126, 234] }
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // Service-wise Section
        if (analyticsData.serviceWise && analyticsData.serviceWise.length > 0) {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.text('Service-wise Breakdown', 14, yPos);
            yPos += 7;

            const serviceTableData = analyticsData.serviceWise.map(s => [
                s.serviceName,
                s.total.toString(),
                s.completed.toString(),
                s.cancelled.toString(),
                s.noShows.toString()
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Service', 'Total', 'Completed', 'Cancelled', 'No-Shows']],
                body: serviceTableData,
                theme: 'striped',
                headStyles: { fillColor: [102, 126, 234] }
            });

            yPos = doc.lastAutoTable.finalY + 15;
        }

        // Staff-wise Section
        if (analyticsData.staffWise && analyticsData.staffWise.length > 0) {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.text('Staff-wise Performance', 14, yPos);
            yPos += 7;

            const staffTableData = analyticsData.staffWise.map(s => [
                s.staffName,
                s.total.toString(),
                s.completed.toString(),
                `${s.avgWaitingTime} min`
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Staff', 'Total', 'Completed', 'Avg Wait Time']],
                body: staffTableData,
                theme: 'striped',
                headStyles: { fillColor: [102, 126, 234] }
            });
        }

        const filename = `Analytics_${orgName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        doc.save(filename);

        return { success: true, filename };
    } catch (error) {
        console.error('Error exporting analytics to PDF:', error);
        return { success: false, error };
    }
};

/**
 * Export audit logs to Excel
 */
export const exportAuditLogsToExcel = (logs, orgName) => {
    try {
        const data = logs.map(log => ({
            'Timestamp': log.timestamp?.toDate?.()?.toLocaleString() || 'N/A',
            'Action': log.action || 'N/A',
            'Performed By': log.userName || log.userEmail || 'N/A',
            'Role': log.userRole || 'N/A',
            'Entity Type': log.entityType || 'N/A',
            'Details': JSON.stringify(log.metadata || log.details || {}),
            'IP Address': log.ipAddress || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');

        const filename = `Audit_Logs_${orgName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
        XLSX.writeFile(wb, filename);

        return { success: true, filename };
    } catch (error) {
        console.error('Error exporting audit logs to Excel:', error);
        return { success: false, error };
    }
};
