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

    return axios.post(process.env.AUTH_URL, qs.stringify(body)).then((res) => {
        res.data.access_token, res.data.userName;
    });
}

async function getIsHoliday(userId, accessToken) {
    const headers = utils.buildAuthorizationHeader(accessToken);

    return await axios
        .get(`${process.env.API_URL}/users/${userId}/workdaylite`, { params, headers })
        .then((res) => res.data.IsHoliday || res.data.IsWeekend);
}

async function postSign(accessToken) {
    const headers = utils.buildAuthorizationHeader(accessToken);
    const body = utils.buildSign();

    console.log('headers', headers);
    console.log('body', body);

    return { signEventId: 'a1a00ffd-6fb7-4910-8194-df8a3d811573' };
}

async function main() {
    const { accessToken, userName } = await doLogin(process.env.USERNAME, process.env.PASSWORD);
    console.log('accessToken', accessToken);
    console.log('userName', userName);
    const isHoliday = await getIsHoliday(userName, accessToken);
    console.log('isHoliday', isHoliday);
    console.log('getTime', utils.getTime());

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
}

(async () => {
    try {
        const timezone = 'Europe/Madrid';
        const keepAliveCron = cron.schedule('*/15 * * * *', keepAlive, { timezone });
        const signerCronHours = utils.getSignerCronHours();
        console.log('signerCronHours', signerCronHours);
        const signerCron = new cron.schedule(`0 ${signerCronHours} * * 1-5`, main, {
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
