import { practicePolicy } from './data';

export type AnswerCheck = { valid: boolean; message: string };
export type PracticeSession = { input: string; openedHints: number[]; rewarded: boolean };

export function isPracticeSession(value: unknown): value is PracticeSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as PracticeSession;
  return typeof session.input === 'string' && session.input.length <= practicePolicy.inputLimit &&
    typeof session.rewarded === 'boolean' && Array.isArray(session.openedHints) &&
    session.openedHints.every(id => Number.isInteger(id) && id >= 1 && id <= 3) &&
    new Set(session.openedHints).size === session.openedHints.length;
}

export function autonomyReward(base: number, openedEarly: number): number {
  return Math.max(practicePolicy.minimumRewardGp, base - Math.max(0, openedEarly) * practicePolicy.hintPenaltyGp);
}

/** A deliberately small arithmetic parser for the sample exercise; never executes user code. */
function evaluateExpression(source: string, coefficient: number): number {
  const scanned = source.match(/\d+(?:\.\d+)?|[a()+\-*/^]/g);
  if (!scanned || scanned.join('') !== source || scanned.length > 256) throw new Error('Unsupported expression');
  const tokens = scanned;
  let position = 0;
  const peek = () => tokens[position];
  function atom(): number {
    const token = tokens[position++];
    if (token === '(') {
      const value = sum();
      if (tokens[position++] !== ')') throw new Error('Unclosed parenthesis');
      return value;
    }
    if (token === 'a') return coefficient;
    if (token && /^\d/.test(token)) return Number(token);
    throw new Error('Expected number');
  }
  function power(): number {
    const left = atom();
    if (peek() === '^') { position++; return left ** unary(); }
    return left;
  }
  function unary(): number {
    if (peek() === '+') { position++; return unary(); }
    if (peek() === '-') { position++; return -unary(); }
    return power();
  }
  function product(): number {
    let value = unary();
    while (peek() === '*' || peek() === '/' || peek() === 'a' || peek() === '(' || /^\d/.test(peek() ?? '')) {
      const token = peek();
      if (token === '*' || token === '/') position++;
      const right = unary();
      value = token === '/' ? value / right : value * right;
    }
    return value;
  }
  function sum(): number {
    let value = product();
    while (peek() === '+' || peek() === '-') {
      const operator = tokens[position++];
      const right = product();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }
  const value = sum();
  if (position !== tokens.length || !Number.isFinite(value)) throw new Error('Invalid expression');
  return value;
}

/** Verifies arithmetic and an explicit a=… conclusion for this sample only, not arbitrary proofs. */
export function verifySampleAnswer(input: string, point: { x: number; y: number }): AnswerCheck {
  if (!input.trim()) return { valid: false, message: 'Hãy nhập bước giải và kết luận hệ số a trước khi kiểm tra.' };
  if (input.length > practicePolicy.inputLimit) return { valid: false, message: 'Bước giải quá dài. Hãy trình bày bằng các phép biến đổi ngắn gọn.' };
  const coefficient = point.y / point.x ** 2;
  if (!Number.isFinite(coefficient) || coefficient === 0) return { valid: false, message: 'Bài mẫu chưa có hệ số hợp lệ để đối chiếu.' };
  let normalized = input.trim().replace(/\$/g, '').replace(/\s+/g, '')
    .replace(/\\(?:iff|Leftrightarrow|Rightarrow|implies)|⇔|⇒|=>/g, ';')
    .replace(/\\(?:cdot|times)|×|·/g, '*').replace(/÷/g, '/')
    .replace(/−/g, '-').replace(/²/g, '^2').replace(/\\(?:left|right)/g, '');
  while (/\\frac\{[^{}]+\}\{[^{}]+\}/.test(normalized)) {
    normalized = normalized.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))');
  }
  normalized = normalized.replace(/[{}]/g, match => match === '{' ? '(' : ')');
  const equations = normalized.split(';');
  let isolatedConclusion = false;
  try {
    for (const equation of equations) {
      const parts = equation.split('=');
      if (parts.length < 2 || parts.some(part => !part)) throw new Error('Expected equation');
      const values = parts.map(part => evaluateExpression(part, coefficient));
      if (values.some(value => Math.abs(value - values[0]) > 1e-9)) {
        return { valid: false, message: 'Có phép biến đổi chưa đúng. Kiểm tra dấu, bình phương số âm và phép chia ở từng bước.' };
      }
      if (parts.includes('a') && parts.some(part => !part.includes('a'))) isolatedConclusion = true;
    }
  } catch {
    return { valid: false, message: 'Chưa đối chiếu được cách viết này. Bài mẫu hỗ trợ số, a, dấu =, +, −, ×, /, bình phương, phân số và ⇔. Hãy viết rõ a = kết quả.' };
  }
  return isolatedConclusion
    ? { valid: true, message: 'Các phép tính khớp với bài mẫu và hệ số a thỏa mãn đề bài.' }
    : { valid: false, message: 'Phép biến đổi phù hợp. Hãy viết thêm kết luận a = kết quả để hoàn thành bước giải.' };
}
