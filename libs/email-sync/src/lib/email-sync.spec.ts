import { emailSync } from './email-sync';

describe('emailSync', () => {
  it('should work', () => {
    expect(emailSync()).toEqual('email-sync');
  });
});
