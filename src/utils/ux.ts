import chalk from 'chalk';
import ora from 'ora';

export { chalk };

export function spinner(text: string) {
  return ora({ text, spinner: 'dots' }).start();
}

export function success(msg: string): string {
  return chalk.green('✓') + ' ' + msg;
}

export function warn(msg: string): string {
  return chalk.yellow('!') + ' ' + msg;
}

export function error(msg: string): string {
  return chalk.red('✗') + ' ' + msg;
}

export function riskLevel(level: string): string {
  switch (level) {
    case 'high': return chalk.red.bold(level.toUpperCase());
    case 'medium': return chalk.yellow.bold(level.toUpperCase());
    case 'low': return chalk.green.bold(level.toUpperCase());
    default: return level;
  }
}

export function filePath(p: string): string {
  return chalk.cyan(p);
}

export function heading(text: string): string {
  return chalk.bold.underline(text);
}
