/**
 * 加密工具函数
 * V2.0 - 承诺-揭秘机制
 */

/**
 * 生成随机字符串（用作random_value）
 * @param length 长度，默认32字符
 * @returns 随机字符串
 */
export function generateRandomValue(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // 使用crypto.getRandomValues获取安全的随机数
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
}

/**
 * 计算SHA256哈希
 * @param message 要哈希的消息
 * @returns Promise<string> 十六进制哈希字符串
 */
export async function sha256Hash(message: string): Promise<string> {
  // 将字符串转换为Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  // 计算SHA256哈希
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // 转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * 验证random_value是否匹配random_hash
 * @param randomValue 原始随机值
 * @param randomHash 哈希值
 * @returns Promise<boolean> 是否匹配
 */
export async function verifyRandomHash(
  randomValue: string,
  randomHash: string
): Promise<boolean> {
  const calculatedHash = await sha256Hash(randomValue);
  return calculatedHash === randomHash;
}

/**
 * 生成带哈希的随机值对
 * @returns Promise<{randomValue: string, randomHash: string}>
 */
export async function generateRandomPair(): Promise<{
  randomValue: string;
  randomHash: string;
}> {
  const randomValue = generateRandomValue();
  const randomHash = await sha256Hash(randomValue);
  
  return {
    randomValue,
    randomHash,
  };
}

