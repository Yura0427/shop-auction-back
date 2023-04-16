export default (phoneNumber: string): string => {
  return phoneNumber.replace(/\D/g, '');
};
