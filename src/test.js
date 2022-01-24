// const web3 = require("web3");
// const keccak256 = require('js-sha3').keccak256;
// //0x6a4F8E577BB6F3b1aed131C67002C2A64Eb0A0fD
// async function main() {
//     try {
//         const pubKey = 'a9c4b5eceda939dccdb8952ac62a2ae5b80841f5224a0947ab0e700b9153b86bde8ad371801e5ea17ad710b97f0aa480';
//         const address = keccak256(Buffer.from(pubKey, 'hex')).slice(64 - 40);
//         // const address = keccak256(pubKey).slice(64-40);
//         console.log(`Public Key: ${pubKey}`);
//         console.log(`Address: 0x${address.toString()}`);
//         console.log(web3.utils.isAddress(address.toString()));
//     } catch (err) {
//         console.log(err);
//     }
// }
//
// main();

const assert = require('assert');
const EC = require('elliptic').ec;
const keccak256 = require('js-sha3').keccak256;
async function main() {
    try {
        const ec = new EC('secp256k1');
        // Decode public key
        const key = ec.keyFromPublic('a9c4b5eceda939dccdb8952ac62a2ae5b80841f5224a0947ab0e700b9153b86bde8ad371801e5ea17ad710b97f0aa480', 'hex');
        // Convert to uncompressed format
        const publicKey = key.getPublic().encode('hex').slice(2);
        console.log(publicKey);
        // Now apply keccak
        const address = keccak256(Buffer.from(publicKey, 'hex')).slice(64 - 40);

        console.log(`Public Key: 0x${publicKey}`);
        console.log(`Address: 0x${address.toString()}`);
    } catch (err) {
        console.log(err);
    }
}

main();