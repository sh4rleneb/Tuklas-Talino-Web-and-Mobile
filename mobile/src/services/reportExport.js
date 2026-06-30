import * as LegacyFileSystem from 'expo-file-system/legacy';
import { File, Paths } from 'expo-file-system';
import { getToken } from '../api/client';
import * as Sharing from 'expo-sharing';

function escapeReportHtml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function summaryReportHtml(title, reportText) {
  const rows = String(reportText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(':');

      if (separatorIndex === -1) {
        return `
          <tr>
            <th colspan="2">${escapeReportHtml(line)}</th>
          </tr>
        `;
      }

      return `
        <tr>
          <th>${escapeReportHtml(line.slice(0, separatorIndex).trim())}</th>
          <td>${escapeReportHtml(line.slice(separatorIndex + 1).trim())}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <html>
      <body style="font-family:Arial;padding:24px">
        <h2>${escapeReportHtml(title)}</h2>
        <table border="1" cellspacing="0" cellpadding="8" width="100%">
          ${rows}
        </table>
      </body>
    </html>
  `;
}


async function shareReportFile(fileUri, options) {
  console.log('[SHARE] fileUri =', fileUri);

  const available = await Sharing.isAvailableAsync();
  console.log('[SHARE] available =', available);

  if (!available) {
    console.log('[SHARE] Sharing unavailable');
    return fileUri;
  }

  try {
    const result = await Sharing.shareAsync(fileUri, options);
    console.log('[SHARE] result =', result);
  } catch (err) {
    console.log('========== SHARE ERROR ==========');
    console.log('Message:', err?.message);
    console.log('Name:', err?.name);
    console.log('Raw:', err);
    console.log('=================================');
    throw err;
  }

  return fileUri;
}

async function saveReportFile(file, title, filename, options) {
  console.log('[SAVE] file.uri =', file.uri);
  console.log('[SAVE] exists =', file.exists);

  return shareReportFile(file.uri, {
    ...options,
    dialogTitle: `${title} - Save ${filename}`,
  });
}

export async function downloadTextReport({
  title,
  filename,
  mimeType,
  loader,
}) {
  const content = await loader();

  const file = new File(Paths.cache, filename);

  if (file.exists) {
    file.delete();
  }

  file.write(content || '');

  return saveReportFile(file, title, filename, {
    mimeType,
    UTI:
      mimeType === 'text/csv'
        ? 'public.comma-separated-values-text'
        : 'public.plain-text',
  });
}


export async function downloadPdfReport({
  title,
  filename,
  loader,
}) {
  void loader;

  const token = await getToken();

  const destination = new File(Paths.cache, filename);

  if (destination.exists) {
    destination.delete();
  }

  console.log('[PDF] Downloading with File.downloadFileAsync');

  const file = await File.downloadFileAsync(
    'https://tuklastalino.com/api/reports/summary.pdf',
    destination,
    {
      idempotent: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log('[PDF] Saved to:', file.uri);

  return saveReportFile(file, title, filename, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
  });
}
