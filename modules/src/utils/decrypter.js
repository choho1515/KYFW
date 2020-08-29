const _Array = java.lang.reflect.Array
const _Byte = java.lang.Byte
const _Integer = java.lang.Integer
const _String = java.lang.String

exports.Decrypt = function () {
    let iv = toByteArray([15, 8, 1, 0, 25, 71, 37, -36, 21, -11, 23, -32, -31, 21, 12, 53])
    let password = toCharArray([22, 8, 9, 111, 2, 23, 43, 8, 33, 33, 10, 16, 3, 3, 7, 6])
    let prefixes = ["", "", "12", "24", "18", "30", "36", "12", "48", "7", "35", "40", "17", "23", "29", "isabel", "kale", "sulli", "van", "merry", "kyle", "james", "maddux", "tony", "hayden", "paul", "elijah", "dorothy", "sally", "bran", "extr.ursra"]
    let ivParameterSpec = new javax.crypto.spec.IvParameterSpec(iv)
    let cipher = javax.crypto.Cipher.getInstance("AES/CBC/PKCS5Padding")
    let cache = {}

    function toByteArray(bytes) {
        let res = _Array.newInstance(_Byte.TYPE, bytes.length)
        for (let i = 0; i < bytes.length; i++) {
            res[i] = new _Integer(bytes[i]).byteValue()
        }
        return res
    }

    function toCharArray(chars) {
        return new _String(chars.map((e) => String.fromCharCode(e)).join("")).toCharArray()
    }

    function keygen(key, enc) {
        let index = cache[key + '_' + enc]
        if (!index) {
            let salt = new _String((prefixes[enc] + key).slice(0, 16).padEnd(16, "\0")).getBytes("UTF-8")
            let secretKeySpec = new javax.crypto.spec.SecretKeySpec(javax.crypto.SecretKeyFactory.getInstance("PBEWITHSHAAND256BITAES-CBC-BC").generateSecret(new javax.crypto.spec.PBEKeySpec(password, salt, 2, 256)).getEncoded(), "AES")
            cache[key + '_' + enc] = secretKeySpec
            return secretKeySpec
        } else return index
    }
    return {
        derive: function (key, enc) {
            return keygen(key, enc)
        },
        execute: function (key, enc, context) {
            try {
                cipher.init(2, keygen(key, enc), ivParameterSpec)
                return String(new _String(cipher.doFinal(android.util.Base64.decode(context, 0)), "UTF-8"))
            } catch (e) {
                return null
            }
        }
    }
}
