import CryptoJS from "crypto-js";
import dev from '../config/dev';

var key = dev.key;
var iv = dev.iv;

export const AESDecryption = (cipherText) => {
    let cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: CryptoJS.enc.Base64.parse(cipherText)
        });

    let decrypted = CryptoJS.AES.decrypt(
        cipherParams,
        CryptoJS.enc.Base64.parse(key),
        {
            iv: CryptoJS.enc.Base64.parse(iv),
        });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

export const AESEncryption = (plainText) => {
    var encrypted = CryptoJS.AES.encrypt(
        plainText,
        CryptoJS.enc.Base64.parse(key),
        {
            iv: CryptoJS.enc.Base64.parse(iv)
        });
    return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
}

export const AESDecryptionParam = (cipherText) => {   
    let cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(cipherText.replace(/\ /g, '/'))
    });

    let decrypted = CryptoJS.AES.decrypt(
        cipherParams,
        CryptoJS.enc.Base64.parse(key),
        {
            iv: CryptoJS.enc.Base64.parse(iv),
        });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

export const AESEncryptionParam = (plainText) => {
    var encrypted = CryptoJS.AES.encrypt(
        plainText,
        CryptoJS.enc.Base64.parse(key),
        {
            iv: CryptoJS.enc.Base64.parse(iv)
        });
    return encrypted.ciphertext.toString(CryptoJS.enc.Base64).replace(/\//g, ' ');
}