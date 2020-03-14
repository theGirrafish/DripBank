const fs = require('fs');
const {google} = require('googleapis');

const CS_PATH = './client_secret.json';
const TOKEN_PATH = './credentials.json';


const initializeOAuth = () => {
    try {
        const {client_secret, client_id, redirect_uris} = JSON.parse(fs.readFileSync(CS_PATH)).web;
        const OA2C = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        OA2C.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
        return OA2C;
    } catch (error) {
        console.error('Error loading client secret file:', error);
    }
}

const randomInRange = (min, max) => Math.floor(Math.random() * (max-min+1) + min);

module.exports = {initializeOAuth, randomInRange};
