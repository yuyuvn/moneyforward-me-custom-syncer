## Moneyforward ME

A class for interacting with MoneyForward ME via browser automation.

### Authentication

The MoneyforwardCashAccount class supports three authentication methods:

1. Using environment variables:
   - `MONEYFORWARD_USER` - Your MoneyForward email
   - `MONEYFORWARD_PASSWORD` - Your MoneyForward password
   - `MONEYFORWARD_2FA_SECRET` - (Optional) Your 2FA secret key for TOTP generation

2. Providing credentials directly:
   ```typescript
   const mf = new MoneyforwardCashAccount({
     email: 'your-email@example.com',
     password: 'your-password',
     twoFASecret: 'your-2fa-secret-key', // For automatic TOTP generation
   });
   ```
   ```

### Getting Your 2FA Secret Key

To extract your 2FA secret key from MoneyForward ME:

1. When setting up 2FA in MoneyForward, you're shown a QR code.
2. The QR code contains a URL like `otpauth://totp/MoneyForward:user@example.com?secret=ABCDEFGHIJKLMNOP&issuer=MoneyForward`.
3. The secret key is the value after `secret=` (in this example, `ABCDEFGHIJKLMNOP`).

If you've already set up 2FA, you may need to disable and re-enable it to view the secret key.

### Methods

- `updateCryptoBalance(account: string, assets: Asset[])` - Update crypto asset balances
- `updatePayBalance(account: string, balance: number)` - Update digital payment balances
- `updatePointsBalance(account: string, balance: number)` - Update point balances
- `finalize()` - Close the browser session
- `closePage()` - Close the current page
