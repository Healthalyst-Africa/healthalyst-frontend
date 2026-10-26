const FILE_SIZE_UNITS = ["B", "KB", "MB", "GB"] as const;

/** A short, human-readable file size, such as "820 KB" or "2.4 MB". */
export function formatFileSize(sizeInBytes: number): string {
  let size = sizeInBytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < FILE_SIZE_UNITS.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const roundedSize =
    unitIndex === 0 || size >= 10 ? Math.round(size) : size.toFixed(1);
  return `${roundedSize} ${FILE_SIZE_UNITS[unitIndex]}`;
}
