import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
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
  if (!(await Sharing.isAvailableAsync())) {
    return fileUri;
  }

  await Sharing.shareAsync(fileUri, options);
  return fileUri;
}

async function saveReportFile(file, title, filename, options) {
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
  const content = await loader();

  const printed = await Print.printToFileAsync({
    html: summaryReportHtml(title, content),
  });

  const source = new File(printed.uri);
  const file = new File(Paths.cache, filename);

  if (file.exists) {
    file.delete();
  }

  source.copy(file);

  return saveReportFile(file, title, filename, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
  });
}
