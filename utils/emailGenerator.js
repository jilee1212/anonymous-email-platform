const crypto = require('crypto');
const config = require('../config/config');

class EmailGenerator {
  constructor() {
    this.domain = config.domain.email;
    this.wordList = [
      'apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest', 'garden', 'harbor',
      'island', 'jungle', 'knight', 'lemon', 'mountain', 'ocean', 'planet', 'queen',
      'river', 'sunset', 'tiger', 'umbrella', 'village', 'window', 'xylophone', 'yellow',
      'zebra', 'alpine', 'beach', 'castle', 'desert', 'eclipse', 'fountain', 'galaxy'
    ];
  }

  // 무작위 이메일 주소 생성
  generateEmailAddress() {
    const randomString = crypto.randomBytes(16).toString('hex');
    return `${randomString}@${this.domain}`;
  }

  // 접근 키 생성 (12개 단어 조합)
  generateAccessKey() {
    const words = [];
    for (let i = 0; i < 12; i++) {
      const randomIndex = crypto.randomInt(0, this.wordList.length);
      words.push(this.wordList[randomIndex]);
    }
    return words.join('-');
  }

  // 64자 무작위 문자열 접근 키 생성 (대안)
  generateRandomAccessKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  // 이메일 주소 유효성 검사
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 접근 키 형식 검사
  isValidAccessKey(accessKey) {
    // 12개 단어 조합 형식 또는 64자 hex 형식
    const wordPattern = /^[a-z]+(-[a-z]+){11}$/;
    const hexPattern = /^[a-f0-9]{64}$/;
    
    return wordPattern.test(accessKey) || hexPattern.test(accessKey);
  }

  // 이메일과 접근 키 쌍 생성
  generateEmailPair() {
    const emailAddress = this.generateEmailAddress();
    const accessKey = this.generateAccessKey();
    
    return {
      emailAddress,
      accessKey,
      createdAt: new Date()
    };
  }

  // 접근 키를 해시로 변환 (저장용)
  hashAccessKey(accessKey) {
    return crypto.createHash('sha256').update(accessKey).digest('hex');
  }

  // 접근 키 검증
  verifyAccessKey(inputKey, hashedKey) {
    const inputHash = this.hashAccessKey(inputKey);
    return inputHash === hashedKey;
  }
}

module.exports = new EmailGenerator();
