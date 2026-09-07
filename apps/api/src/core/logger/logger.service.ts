import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService extends Logger {
  constructor() {
    super('Apointli');
  }
  
  log(message: string, context?: string) {
    super.log(message, context || 'Apointli');
  }
  
  error(message: string, trace?: string, context?: string) {
    super.error(message, trace, context || 'Apointli');
  }
  
  warn(message: string, context?: string) {
    super.warn(message, context || 'Apointli');
  }
  
  debug(message: string, context?: string) {
    super.debug(message, context || 'Apointli');
  }
  
  verbose(message: string, context?: string) {
    super.verbose(message, context || 'Apointli');
  }
}
