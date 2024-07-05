const dayjs = require('dayjs');

function buildAuthorizationHeader(accessToken) {
    return { authorization: `Bearer ${accessToken}` };
}

function getTodayDate() {
    return dayjs().format('YYYY-MM-DD');
}

function getCurrentMonth() {
    return dayjs().month();
}

function getTime() {
    return dayjs().format('mm:ss');
}

function getSignerCronHours() {
    const month = getCurrentMonth();
    let signerCronHour = [];
    if (month >= process.env.START_CONTINUOUS_PERIOD && month <= process.env.END_CONTINUOUS_PERIOD) {
        signerCronHour = [process.env.START_HOUR, process.env.BREAK_END_HOUR];
    } else {
        signerCronHour = [
            process.env.START_HOUR,
            process.env.BREAK_START_HOUR,
            process.env.BREAK_END_HOUR,
            process.env.END_HOUR,
        ];
    }

    return signerCronHour.join(',').toString();
}

function buildSign() {
    return {
        agreementEventId: null,
        requestId: null,
        deviceId: 'WebApp',
        latitude: process.env.LATITUDE,
        longitude: process.env.LONGITUDE,
        timezoneOffset: process.env.TIMEZONEOFFSET,
    };
}

module.exports = {
    buildAuthorizationHeader,
    getTodayDate,
    getTime,
    getSignerCronHours,
    buildSign,
};
