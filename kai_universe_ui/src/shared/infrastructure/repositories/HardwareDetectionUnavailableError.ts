export class HardwareDetectionUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HardwareDetectionUnavailableError';
  }
}
