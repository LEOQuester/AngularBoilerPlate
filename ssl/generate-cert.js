const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

// Generate a self-signed certificate
function generateCertificate() {
    // Generate a keypair
    const keys = forge.pki.rsa.generateKeyPair(2048);

    // Create a certificate
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    const attrs = [{
        name: 'commonName',
        value: 'localhost'
    }, {
        name: 'countryName',
        value: 'US'
    }, {
        shortName: 'ST',
        value: 'Virginia'
    }, {
        name: 'localityName',
        value: 'Blacksburg'
    }, {
        name: 'organizationName',
        value: 'Test'
    }, {
        shortName: 'OU',
        value: 'Test'
    }];

    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([{
        name: 'basicConstraints',
        cA: true
    }, {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
    }, {
        name: 'subjectAltName',
        altNames: [{
            type: 2, // DNS
            value: 'localhost'
        }]
    }]);

    // Self-sign the certificate
    cert.sign(keys.privateKey);

    // Convert to PEM format
    const certPem = forge.pki.certificateToPem(cert);
    const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);

    // Ensure ssl directory exists
    if (!fs.existsSync(__dirname)) {
        fs.mkdirSync(__dirname, { recursive: true });
    }

    // Write the files
    fs.writeFileSync(path.join(__dirname, 'localhost.pem'), certPem);
    fs.writeFileSync(path.join(__dirname, 'localhost-key.pem'), privateKeyPem);

    console.log('Certificate and private key have been generated!');
}

generateCertificate();