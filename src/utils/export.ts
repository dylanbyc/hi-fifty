import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';
import type { MonthlyReport, AttendanceRecord } from '../types';

/**
 * Export monthly report to CSV
 */
export function exportToCSV(
  report: MonthlyReport,
  records: AttendanceRecord[],
  monthName: string
): void {
  // Filter records for the month
  const monthRecords = records.filter(record => {
    const recordDate = parseISO(record.date);
    return recordDate.getMonth() + 1 === report.month && 
           recordDate.getFullYear() === report.year;
  });

  // Sort by date
  monthRecords.sort((a, b) => a.date.localeCompare(b.date));

  // Create CSV content
  const headers = ['Date', 'Day', 'Type', 'Leave Type'];
  const rows = monthRecords.map(record => {
    const date = parseISO(record.date);
    const dayName = format(date, 'EEEE');
    return [
      record.date,
      dayName,
      record.type,
      record.leaveType || ''
    ];
  });

  const csvContent = [
    [`ANZ RTO Attendance Report - ${monthName} ${report.year}`],
    [],
    ['Summary'],
    [`Total Working Days,${report.totalWorkingDays}`],
    [`Days in Office,${report.daysInOffice}`],
    [`Days WFH,${report.daysWFH}`],
    [`Days on Leave,${report.daysLeave}`],
    [`Attendance Percentage,${report.attendancePercentage}%`],
    [],
    ['Daily Records'],
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].map(row => Array.isArray(row) ? row.join(',') : row).join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `anz-rto-report-${monthName.toLowerCase()}-${report.year}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export monthly report to PDF
 */
export function exportToPDF(
  report: MonthlyReport,
  records: AttendanceRecord[],
  monthName: string
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let yPos = margin;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(0, 65, 101); // ANZ blue
  doc.text('ANZ RTO Attendance Report', margin, yPos);
  yPos += lineHeight + 2;

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`${monthName} ${report.year}`, margin, yPos);
  yPos += lineHeight + 5;

  // Summary section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, yPos);
  yPos += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.text(`Total Working Days: ${report.totalWorkingDays}`, margin + 5, yPos);
  yPos += lineHeight;
  doc.text(`Days in Office: ${report.daysInOffice}`, margin + 5, yPos);
  yPos += lineHeight;
  doc.text(`Days WFH: ${report.daysWFH}`, margin + 5, yPos);
  yPos += lineHeight;
  doc.text(`Days on Leave: ${report.daysLeave}`, margin + 5, yPos);
  yPos += lineHeight;

  // Attendance percentage with color
  const percentageColor = report.attendancePercentage >= 50 
    ? [16, 185, 129] // green
    : report.attendancePercentage >= 45
    ? [245, 158, 11] // amber
    : [239, 68, 68]; // red

  doc.setTextColor(percentageColor[0], percentageColor[1], percentageColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Attendance Percentage: ${report.attendancePercentage}%`, margin + 5, yPos);
  yPos += lineHeight + 5;

  // Daily records table
  const monthRecords = records.filter(record => {
    const recordDate = parseISO(record.date);
    return recordDate.getMonth() + 1 === report.month && 
           recordDate.getFullYear() === report.year;
  });

  monthRecords.sort((a, b) => a.date.localeCompare(b.date));

  if (monthRecords.length > 0) {
    // Check if we need a new page
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Daily Records', margin, yPos);
    yPos += lineHeight + 2;

    // Table headers
    const colWidths = [40, 50, 50, 50];
    const headers = ['Date', 'Day', 'Type', 'Leave Type'];
    let xPos = margin;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    headers.forEach((header, index) => {
      doc.text(header, xPos, yPos);
      xPos += colWidths[index];
    });
    yPos += lineHeight;

    // Table rows
    doc.setFont('helvetica', 'normal');
    monthRecords.forEach(record => {
      // Check if we need a new page
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = margin;
        // Redraw headers
        xPos = margin;
        doc.setFont('helvetica', 'bold');
        headers.forEach((header, index) => {
          doc.text(header, xPos, yPos);
          xPos += colWidths[index];
        });
        yPos += lineHeight;
        doc.setFont('helvetica', 'normal');
      }

      const date = parseISO(record.date);
      const dayName = format(date, 'EEE');
      const dateStr = format(date, 'MMM dd');

      xPos = margin;
      doc.text(dateStr, xPos, yPos);
      xPos += colWidths[0];
      doc.text(dayName, xPos, yPos);
      xPos += colWidths[1];
      doc.text(record.type, xPos, yPos);
      xPos += colWidths[2];
      doc.text(record.leaveType || '-', xPos, yPos);
      yPos += lineHeight;
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${format(new Date(), 'MMM dd, yyyy')} - Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  doc.save(`anz-rto-report-${monthName.toLowerCase()}-${report.year}.pdf`);
}

