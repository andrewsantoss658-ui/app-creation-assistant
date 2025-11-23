// Validação e formatação de CPF/CNPJ

export const formatCpfCnpj = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 11) {
    // CPF: 000.000.000-00
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ: 00.000.000/0000-00
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
};

export const validateCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '');
  
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(numbers.charAt(10))) return false;
  
  return true;
};

export const validateCNPJ = (cnpj: string): boolean => {
  const numbers = cnpj.replace(/\D/g, '');
  
  if (numbers.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  let pos = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers.charAt(i)) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(numbers.charAt(12))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  pos = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers.charAt(i)) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(numbers.charAt(13))) return false;
  
  return true;
};

export const validateCpfCnpj = (value: string): boolean => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    return validateCPF(value);
  } else if (numbers.length === 14) {
    return validateCNPJ(value);
  }
  
  return false;
};
