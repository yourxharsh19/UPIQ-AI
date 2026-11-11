export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB to align with backend FileValidationService

export const ALLOWED_EXTENSIONS = ['.pdf', '.csv', '.txt'];

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/csv',
  'application/csv',
  'text/plain',
  'application/vnd.ms-excel',
];

/**
 * Validates a statement file on the client before network upload.
 * Checks for presence, empty size, extension, oversize (>10MB), and invalid MIME types.
 *
 * @param {File|Blob|{name?: string, size?: number, type?: string}} file
 * @returns {{ valid: boolean, error?: string, fileType?: 'pdf' | 'csv' }}
 */
export const validateStatementFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected. Please choose a PDF or CSV file.' };
  }

  const filename = typeof file.name === 'string' ? file.name.trim() : '';
  if (!filename) {
    return { valid: false, error: 'The selected file does not have a valid filename.' };
  }

  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload a .csv or .pdf file.',
    };
  }

  const extension = filename.slice(lastDot).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file type "${extension}". Please upload a bank statement in .pdf or .csv format.`,
    };
  }

  const fileSize = typeof file.size === 'number' ? file.size : 0;
  if (fileSize <= 0) {
    return {
      valid: false,
      error: 'The selected file is empty (0 bytes). Please upload a file containing transaction data.',
    };
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (fileSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the maximum allowed limit of 10 MB.`,
    };
  }

  // If MIME type is present and explicitly conflicts with allowed types (e.g. image/png renamed to .csv)
  if (file.type && typeof file.type === 'string') {
    const normalizedType = file.type.toLowerCase().trim();
    if (normalizedType && !ALLOWED_MIME_TYPES.includes(normalizedType)) {
      // In some operating systems, CSV files might have generic application/octet-stream; allow that if extension is valid
      if (normalizedType !== 'application/octet-stream') {
        return {
          valid: false,
          error: `MIME type "${file.type}" is not supported. Please upload a genuine .pdf or .csv statement.`,
        };
      }
    }
  }

  const fileType = extension === '.pdf' ? 'pdf' : 'csv';
  return { valid: true, fileType };
};
