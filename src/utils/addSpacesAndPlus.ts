export default (phoneNumber: string): string => {
  if (!phoneNumber) return phoneNumber;
  const numbers = phoneNumber.split('');
  const result = ['+', ...numbers];
  result.splice(4, 0, ' ');
  result.splice(7, 0, ' ');
  result.splice(11, 0, ' ');
  result.splice(14, 0, ' ');
  return result.join('');
};
