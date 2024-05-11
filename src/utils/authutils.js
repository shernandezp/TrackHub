import CryptoJS from 'crypto-js';
import SHA256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';

const generateCodeVerifier = () => {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let verifier = '';
    for (let i = 0; i < 128; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      verifier += charset[randomIndex];
    }
    return verifier;
  };

const generateCodeChallenge = (plain) => {
    const hash = SHA256(plain).toString(Base64);
    return hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

export {
    generateCodeVerifier,
    generateCodeChallenge
};