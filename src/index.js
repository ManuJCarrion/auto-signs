const dotenv = require('dotenv');
const axios = require('axios').default;
const qs = require('qs');
const cron = require('node-cron');
const express = require('express');

const utils = require('./utils');

if (process.env.NODE_ENV === 'development') {
    dotenv.config();
}

async function doLogin(username, password) {
    const body = { grant_type: 'password', username, password };

    return axios.post(process.env.AUTH_URL, qs.stringify(body)).then((res) => res.data);
}

async function getIsHoliday(userid, accessToken) {
    const headers = utils.buildAuthorizationHeader(accessToken);
    console.log(`${process.env.API_URL}/users/${userid}/workdaylite`)
    return await axios
        .get(`${process.env.API_URL}/users/${userid}/workdaylite`, { headers })
        .then((res) => res.data.IsHoliday || res.data.IsWeekend)
        .catch((err) => console.error(err));
}

async function postSign(accessToken) {
    const headers = utils.buildAuthorizationHeader(accessToken);
    const body = utils.buildSign();

    console.log('postSign - headers');
    console.log(headers);
    console.log('body');
    console.log( body);

    return { signEventId: 'a1a00ffd-6fb7-4910-8194-df8a3d811573' };
}

async function main() {
    console.log('entro en main')
    const userData = await doLogin(process.env.USERNAME, process.env.PASSWORD);
    const accessToken = userData.access_token;
    
    const isHoliday = await getIsHoliday(process.env.USERID, accessToken);
    console.log('isHoliday', isHoliday);

    if (isHoliday) {
        console.log('Hoy no ce trabaha shurras!');
        return;
    }

    const signResponse = await postSign(accessToken);

    if (signResponse.status !== 201) {
        console.log(`Quillo ha pasao argo, esto no va`);
        return;
    }
}

async function keepAlive() {
    await axios.get(process.env.APP_URL);
    console.log(`keepAlive`, utils.getTime());
}

(async () => {
    try {
        const timezone = 'Europe/Madrid';
        const keepAliveCron = cron.schedule('*/15 * * * *', keepAlive, { timezone });
        const signerCronHours = utils.getSignerCronHours();
        
        const signerCron = new cron.schedule(`*/1 ${process.env.BREAK_END_HOUR} * * 1-5`, main, {
            timezone,
        });

        const app = express();
        keepAliveCron.start();
        signerCron.start();

        app.get('/', (_, res) => {
            res.send('Esto va a seguí funsionando un rato máh!');
        });

        app.listen(process.env.PORT, async () => {
            console.log(`App escuchando en el puerto ${process.env.PORT}`);
        });
    } catch (err) {
        console.error(err);
    }
})();
