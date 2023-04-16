import { createHash } from 'crypto';

export function formAndGetJsonString(
  action: string,
  amount: number,
  currency: string,
  description: string,
  order_id: string,
) {
  const obj = {
    public_key: process.env.PUBLIC_KEY_LIQPAY,
    private_key: process.env.PRIVATE_KEY_LIQPAY,
    version: '3',
    action,
    amount,
    currency,
    description,
    order_id,
  };

  return JSON.stringify(obj);
}

export function formAndGetData(jsonString: string) {
  return Buffer.from(jsonString).toString('base64');
}

export function decodeData(data: string) {
  return Buffer.from(data, 'base64').toString('utf-8');
}

export function formAndGetSignature(str: string) {
  return createHash('sha1').update(str).digest('base64');
}
