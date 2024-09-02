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

    return axios.post(process.env.AUTH_URL, qs.stringify(body))
        .then((res) => res.data)
        .catch((err) => console.error(err));
}

async function getUserId(accessToken) {
  const headers = utils.buildAuthorizationHeader(accessToken);

  return axios
    .get(`${process.env.API_URL}/users`, { headers })
    .then((res) => res.data.UserId);
}

async function getIsHoliday(userid, accessToken) {
    const headers = utils.buildAuthorizationHeader(accessToken);
    
    return await axios
        .get(`${process.env.API_URL}/users/${userid}/workdaylite`, { headers })
        .then((res) => res.data.IsHoliday || res.data.IsWeekend)
        .catch((err) => console.error(err));
}

async function postSign(accessToken) {
    const headers = utils.buildAuthorizationHeader(accessToken);
    const body = utils.buildSign();

    return await axios.post(`${process.env.API_URL}/svc/signs/signs`, body, { headers });
}

async function main() {
    console.log('entro en main')
    const userData = await doLogin(process.env.USERNAME, process.env.PASSWORD);
    const accessToken = userData.access_token;
    const userId = await getUserId(accessToken);
    
    const isHoliday = await getIsHoliday(userId, accessToken);

    if (isHoliday) {
        console.log('Hoy no ce trabaha shurras!');
        return;
    }

    const signResponse = await postSign(accessToken);

    if (signResponse.status !== 201) {
        console.log(`Quillo ha pasao argo, esto no va`);
        return;
    } else {
        console.log('Hora picada correctamente')
    }
}

async function keepAlive() {
    await axios.get(process.env.APP_URL);
    // Acceder a la web no le parece suficiente para seguir activo 
    // procedo a pedir credenciales y comprobar el día para mantener el servicio activo

    const userData = await doLogin(process.env.USERNAME, process.env.PASSWORD);
    const accessToken = userData.access_token;
    const userId = await getUserId(accessToken);
    
    const isHoliday = await getIsHoliday(userId, accessToken);
}

(async () => {
    try {
        const timezone = 'Europe/Madrid';
        const keepAliveCron = cron.schedule('*/20 * * * *', keepAlive, { timezone });
        const signerCronHours = utils.getSignerCronHours();
        
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
