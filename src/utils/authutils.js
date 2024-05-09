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

  const sha256 = async (plain) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => ('00' + b.toString(16)).slice(-2)).join('');
    return hashHex;
  };
  
  const base64urlencode = (str) => {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };
  
  const generateCodeChallenge = async (codeVerifier) => {
    const hashed = await sha256(codeVerifier);
    return base64urlencode(hashed);
  };

export {
    generateCodeVerifier,
    generateCodeChallenge
};