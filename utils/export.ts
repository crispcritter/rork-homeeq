import { Alert, Platform } from 'react-native';
import { mediumImpact, successNotification } from '@/utils/haptics';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import * as Print from 'expo-print';

export function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function rowsToCSV(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCSVField).join(',')).join('\r\n');
}

export function buildHtmlReport(options: {
  title: string;
  headers: string[];
  dataRows: string[][];
  summaryItems?: { label: string; value: string }[];
  footerLabel?: string;
}): string {
  const { title, headers, dataRows, summaryItems, footerLabel } = options;
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const count = dataRows.length;

  const summaryHtml = summaryItems?.length
    ? `<div class="summary">${summaryItems.map((s) => `<div class="summary-item"><div class="summary-label">${s.label}</div><div class="summary-value">${s.value}</div></div>`).join('')}</div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { font-family: -apple-system, Helvetica Neue, Arial, sans-serif; padding: 24px; color: #1a1a2e; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
  .summary { display: flex; gap: 24px; margin-bottom: 20px; }
  .summary-item { background: #f3f4f6; border-radius: 8px; padding: 12px 16px; }
  .summary-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
  .summary-value { font-size: 18px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #1a1a2e; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  .footer { margin-top: 16px; font-size: 10px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <p class="subtitle">Generated ${dateStr} &bull; ${count} item${count !== 1 ? 's' : ''}</p>
  ${summaryHtml}
  <table>
    <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${dataRows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
  <p class="footer">${footerLabel ?? 'HomeEQ'}</p>
</body>
</html>`;
}

interface ExportActions {
  getCSV: () => string;
  getHTML: () => string;
  filePrefix: string;
  entityName: string;
  entityCount: number;
  emailSubject: string;
  emailBodyHtml: string;
}

export async function handleExportEmail(actions: ExportActions): Promise<void> {
  mediumImpact();
  if (actions.entityCount === 0) {
    Alert.alert('No Data', `There are no ${actions.entityName} to email yet.`);
    return;
  }
  try {
    const csvContent = actions.getCSV();
    const fileName = `${actions.filePrefix}_${new Date().toISOString().split('T')[0]}.csv`;

    if (Platform.OS === 'web') {
      const mailtoBody = encodeURIComponent(`${actions.emailSubject}\n\n${csvContent}`);
      const mailtoSubject = encodeURIComponent(actions.emailSubject);
      window.open(`mailto:?subject=${mailtoSubject}&body=${mailtoBody}`, '_blank');
      successNotification();
      return;
    }

    const file = new File(Paths.cache, fileName);
    file.create({ overwrite: true });
    file.write(csvContent);
    console.log('[Export] CSV file written to:', file.uri);

    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Mail Unavailable', 'No email account is configured on this device.');
      return;
    }

    await MailComposer.composeAsync({
      subject: actions.emailSubject,
      body: actions.emailBodyHtml,
      isHtml: true,
      attachments: [file.uri],
    });
    successNotification();
    console.log('[Export] Mail composer opened successfully');
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[Export] Email error:', message);
    Alert.alert('Email Error', 'Something went wrong while preparing the email.');
  }
}

export async function handleExportPDF(actions: ExportActions): Promise<void> {
  mediumImpact();
  if (actions.entityCount === 0) {
    Alert.alert('No Data', `There are no ${actions.entityName} to export yet.`);
    return;
  }
  try {
    const html = actions.getHTML();

    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }
      successNotification();
      return;
    }

    const { uri } = await Print.printToFileAsync({ html });
    console.log('[Export] PDF saved to:', uri);

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      successNotification();
    } else {
      Alert.alert('PDF Ready', 'PDF saved but sharing is not available on this device.');
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[Export] PDF error:', message);
    Alert.alert('PDF Error', 'Something went wrong while creating the PDF.');
  }
}

export async function handleExportCSV(actions: ExportActions): Promise<void> {
  mediumImpact();
  if (actions.entityCount === 0) {
    Alert.alert('No Data', `There are no ${actions.entityName} to export yet.`);
    return;
  }
  try {
    const csvContent = actions.getCSV();
    const fileName = `${actions.filePrefix}_${new Date().toISOString().split('T')[0]}.csv`;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      successNotification();
      console.log('[Export] Web CSV download triggered');
      return;
    }

    const file = new File(Paths.cache, fileName);
    file.create({ overwrite: true });
    file.write(csvContent);
    console.log('[Export] CSV written to:', file.uri);

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(file.uri, { UTI: 'public.comma-separated-values-text', mimeType: 'text/csv' });
      successNotification();
    } else {
      Alert.alert('CSV Ready', 'CSV saved but sharing is not available on this device.');
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[Export] CSV error:', message);
    Alert.alert('CSV Error', 'Something went wrong while creating the CSV.');
  }
}

export async function handleExportPrint(actions: ExportActions): Promise<void> {
  mediumImpact();
  if (actions.entityCount === 0) {
    Alert.alert('No Data', `There are no ${actions.entityName} to print yet.`);
    return;
  }
  try {
    const html = actions.getHTML();

    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }
      return;
    }

    await Print.printAsync({ html });
    successNotification();
    console.log('[Export] Print dialog opened');
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('[Export] Print error:', message);
    Alert.alert('Print Error', 'Something went wrong while printing.');
  }
}
