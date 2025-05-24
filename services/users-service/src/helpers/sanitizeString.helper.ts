export const sanitizeString = (str: string): string => {
  return str
    .replace(/[$<>()[\]{}'";!%^&*|`~=\\]/g, '')
    .replace(/\.\./g, '')
    .trim();
};
