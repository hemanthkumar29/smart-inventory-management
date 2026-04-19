export const validateEmail = (value) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);

export const validatePassword = (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);

export const isPositiveNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
};
