export const abbrAddr = (address: string): string => {
  if (!address) return '';
  const addr = address.replace('0x', '');
  return `${addr.slice(0, 5)}…${addr.slice(-5)}`;
};
