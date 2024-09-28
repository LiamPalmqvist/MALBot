// IMPORTS
const crypto = require('crypto');

// GENERATING CODE VERIFIER
function dec2hex(dec) {
    return ("0" + dec.toString(16)).substr(-2);
}

function generateCodeVerifier() {
    //var array = new Uint32Array(56 / 2);
    var array = crypto.randomBytes(28);
    return Array.from(array, byte => dec2hex(byte)).join("");
}

// GENERATING CODE CHALLENGE
function sha256(plain) {
    // returns promise ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return crypto.createHash("sha256").update(data).digest();
}

function base64urlencode(a) {
    var str = "";
    var bytes = new Uint8Array(a);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return btoa(str)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

async function generateCodeChallengeFromVerifier(v) {
    var hashed = await sha256(v);
    var base64encoded = base64urlencode(hashed);
    return base64encoded;
}

// GENERATING CODE VERIFIER AND CODE CHALLENGE
async function generateCodeVerifierAndChallenge() {
    // Step 1: Generate the code verifier
    const codeVerifier = generateCodeVerifier();
    console.log("Code Verifier:", codeVerifier);

    // Step 2: Generate the code challenge from the code verifier
    const codeChallenge = await generateCodeChallengeFromVerifier(codeVerifier);
    console.log("Code Challenge:", codeChallenge);

    return { codeVerifier, codeChallenge };
}

// Example usage
/*
generateCodeVerifierAndChallenge().then(({ codeVerifier, codeChallenge }) => {
    // You can now use the codeVerifier and codeChallenge in your OAuth 2.0 PKCE flow
    console.log("Generated Code Verifier and Code Challenge:");
    console.log("Code Verifier:", codeVerifier);
    console.log("Code Challenge:", codeChallenge);
});
*/