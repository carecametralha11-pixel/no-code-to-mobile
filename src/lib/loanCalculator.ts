// Tabela Price (French Amortization System) - Fixed Monthly Payments

export interface LoanSimulation {
  amount: number;
  termMonths: number;
  interestRate: number;
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
  amortizationSchedule: AmortizationEntry[];
}

export interface AmortizationEntry {
  installment: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export function calculateLoan(
  amount: number,
  termMonths: number,
  monthlyInterestRate: number
): LoanSimulation {
  // PMT formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const r = monthlyInterestRate;
  const n = termMonths;
  const P = amount;

  let monthlyPayment: number;
  
  if (r === 0) {
    monthlyPayment = P / n;
  } else {
    const factor = Math.pow(1 + r, n);
    monthlyPayment = P * (r * factor) / (factor - 1);
  }

  // Round to 2 decimal places
  monthlyPayment = Math.round(monthlyPayment * 100) / 100;

  const totalAmount = monthlyPayment * termMonths;
  const totalInterest = totalAmount - amount;

  // Generate amortization schedule
  const amortizationSchedule: AmortizationEntry[] = [];
  let balance = amount;

  for (let i = 1; i <= termMonths; i++) {
    const interest = balance * r;
    const principal = monthlyPayment - interest;
    balance = balance - principal;

    amortizationSchedule.push({
      installment: i,
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100),
    });
  }

  return {
    amount,
    termMonths,
    interestRate: monthlyInterestRate,
    monthlyPayment,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    amortizationSchedule,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function parseCurrencyInput(value: string): number {
  // Remove everything except numbers and comma/dot
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}
