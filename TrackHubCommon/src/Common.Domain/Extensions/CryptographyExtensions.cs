// Copyright (c) 2026 Sergio Hernandez. All rights reserved.
//
//  Licensed under the Apache License, Version 2.0 (the "License").
//  You may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//

using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;

namespace Common.Domain.Extensions;

// Contains extension methods for cryptographic operations.
public static class CryptographyExtensions
{
    // Ciphertext written by this class is tagged so the reader can tell the authenticated
    // AES-GCM format from rows still stored in the original unauthenticated AES-CBC one.
    // Base64 never produces a colon, so the marker cannot collide with a legacy value.
    private const string GcmPrefix = "v2:";
    private const int GcmNonceSize = 12;
    private const int GcmTagSize = 16;
    private const int CbcIvSize = 16;

    private static readonly ConcurrentDictionary<string, byte[]> DerivedKeys = new();

    // Hashes a password using BCrypt hashing algorithm.
    public static string HashPassword(this string value)
        => BCrypt.Net.BCrypt.HashPassword(value);

    // Verifies a hashed password against a plain text password.
    public static bool VerifyHashedPassword(this string hashedPassword, string password)
        => BCrypt.Net.BCrypt.Verify(password, hashedPassword);

    // Generates a random AES key of the specified key size.
    public static byte[] GenerateAesKey(int keySizeBits)
    {
        if (keySizeBits != 128 && keySizeBits != 192 && keySizeBits != 256)
            throw new ArgumentException("Invalid key size. Valid sizes are 128, 192, or 256 bits.", nameof(keySizeBits));

        byte[] key = new byte[keySizeBits / 8];
        RandomNumberGenerator.Fill(key);
        return key;
    }

    // Derives a key from a passphrase and salt using the Rfc2898DeriveBytes algorithm.
    public static byte[] DeriveKey(string passphrase, byte[] salt, int keySize = 256, int iterations = 100000)
    {
        return Rfc2898DeriveBytes.Pbkdf2(
            password: passphrase,
            salt: salt,
            iterations: iterations,
            hashAlgorithm: HashAlgorithmName.SHA256,
            outputLength: keySize / 8
        );
    }

    /// <summary>
    /// Encrypts the given data with AES-GCM, which authenticates the ciphertext so tampering is
    /// detected on read instead of surfacing as a padding error.
    /// </summary>
    public static string EncryptData(this string dataToEncrypt, string passphrase, byte[] salt)
    {
        ArgumentNullException.ThrowIfNull(dataToEncrypt);

        var key = GetDerivedKey(passphrase, salt);
        var plaintext = Encoding.UTF8.GetBytes(dataToEncrypt);

        var payload = new byte[GcmNonceSize + GcmTagSize + plaintext.Length];
        var nonce = payload.AsSpan(0, GcmNonceSize);
        RandomNumberGenerator.Fill(nonce);

        using var aes = new AesGcm(key, GcmTagSize);
        aes.Encrypt(
            nonce,
            plaintext,
            payload.AsSpan(GcmNonceSize + GcmTagSize, plaintext.Length),
            payload.AsSpan(GcmNonceSize, GcmTagSize));

        return GcmPrefix + Convert.ToBase64String(payload);
    }

    /// <summary>
    /// Decrypts a value produced by <see cref="EncryptData"/>. Values stored before the move to
    /// AES-GCM carry no marker and are read with the legacy AES-CBC format, so existing
    /// credential rows keep working until they are next written.
    /// </summary>
    public static string DecryptData(this string encryptedData, string passphrase, byte[] salt)
    {
        ArgumentNullException.ThrowIfNull(encryptedData);

        return encryptedData.StartsWith(GcmPrefix, StringComparison.Ordinal)
            ? DecryptGcm(encryptedData[GcmPrefix.Length..], passphrase, salt)
            : DecryptLegacyCbc(encryptedData, passphrase, salt);
    }

    private static string DecryptGcm(string base64Payload, string passphrase, byte[] salt)
    {
        var payload = Convert.FromBase64String(base64Payload);
        if (payload.Length < GcmNonceSize + GcmTagSize)
            throw new CryptographicException("The encrypted value is malformed.");

        var key = GetDerivedKey(passphrase, salt);
        var plaintext = new byte[payload.Length - GcmNonceSize - GcmTagSize];

        using var aes = new AesGcm(key, GcmTagSize);
        aes.Decrypt(
            payload.AsSpan(0, GcmNonceSize),
            payload.AsSpan(GcmNonceSize + GcmTagSize),
            payload.AsSpan(GcmNonceSize, GcmTagSize),
            plaintext);

        return Encoding.UTF8.GetString(plaintext);
    }

    private static string DecryptLegacyCbc(string encryptedDataWithIvBase64, string passphrase, byte[] salt)
    {
        var encryptedDataWithIv = Convert.FromBase64String(encryptedDataWithIvBase64);
        if (encryptedDataWithIv.Length < CbcIvSize)
            throw new CryptographicException("The encrypted value is malformed.");

        using var aesAlg = Aes.Create();
        aesAlg.Key = GetDerivedKey(passphrase, salt);
        aesAlg.IV = [.. encryptedDataWithIv.Take(CbcIvSize)];
        aesAlg.Padding = PaddingMode.PKCS7;

        var decryptor = aesAlg.CreateDecryptor(aesAlg.Key, aesAlg.IV);

        using var msDecrypt = new MemoryStream(encryptedDataWithIv, CbcIvSize, encryptedDataWithIv.Length - CbcIvSize);
        using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
        using var msResult = new MemoryStream();
        csDecrypt.CopyTo(msResult);

        return Encoding.UTF8.GetString(msResult.ToArray());
    }

    // A credential read decrypts four fields, so deriving per call cost ~400k PBKDF2 iterations
    // on the Router's per-operator sync path. The set of passphrase/salt pairs is per-service
    // configuration, so the cache is effectively fixed-size.
    private static byte[] GetDerivedKey(string passphrase, byte[] salt)
    {
        ArgumentNullException.ThrowIfNull(passphrase);
        ArgumentNullException.ThrowIfNull(salt);

        var cacheKey = Convert.ToBase64String(SHA256.HashData(
            [.. Encoding.UTF8.GetBytes(passphrase), .. salt]));

        return DerivedKeys.GetOrAdd(cacheKey, _ => DeriveKey(passphrase, salt));
    }
}
